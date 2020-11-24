#!/usr/bin/env python3
from logging import LogRecord
from urllib.request import Request, urlopen
import json
import yaml
import git
from logging.handlers import HTTPHandler
import logging.config
import subprocess
from sys import argv
import getpass
import os


class DeploymentError(Exception):
    pass


class SlackWebhookHandler(HTTPHandler):
    """A logging handler that produces a dictionary suitable for the webhooks add-in for Slack."""
    def mapLogRecord(self, record):
        if record.levelno <= 2:
            color = "good"
        else:
            color = "danger"
        return {"text": record.message, "color": color}

    def emit(self, record: LogRecord) -> None:
        """Code adapted from from HTTPRequest.emit."""
        try:
            import http.client
            host = self.host
            h = http.client.HTTPSConnection(host, context=self.context)
            url = self.url
            data = json.dumps(self.mapLogRecord(record))
            h.putrequest("POST", url)
            h.putheader("Content-type",
                        "application/json")
            h.putheader("Content-length", str(len(data)))
            h.endheaders()
            h.send(data.encode('utf-8'))
            h.getresponse()
        except Exception:
            self.handleError(record)


def getSlackWebhookHandler(**kwargs):
    """Define this factory method with __main__.getSlacWebhookHandler in the logging config file."""
    return SlackWebhookHandler(**kwargs)


def github_branch_head_commit(repo_owner: str, repo_name: str, branch_name: str) -> str:
    """Get the full commit hash of the HEAD of the given branch in the repository on Github."""
    request = Request("https://api.github.com/repos/{}/{}/branches/{}".format(repo_owner, repo_name, branch_name),
                      headers={ "Accept": "application/vnd.github.v3+json" })
    try:
        response = urlopen(request)
        return json.loads(response.read())["commit"]["sha"]
    except Exception as ex:
        raise DeploymentError("Github commit retrieval failure: code = %i, reason = %s" % ex.code, ex.reason)


def list_branch_commits(repo: git.Repo, branch: str) -> list:
    """List all full commit hashes included in `branch` HEAD"""
    return list(map(lambda commit: commit.hexsha, repo.iter_commits(branch)))


def update_branch_from_remote(repo: git.Repo, branch: str, remote: str) -> None:
    """Update the given branch in the repository to the remote HEAD. This will do a forced checkout thus deleting
    all repo-local changes. The autodeploy clone should not be modified!"""
    repo.branches[branch].checkout(force=True)
    repo.remote(remote).pull()


def run_proc(command):
    proc = subprocess.Popen(command,
                            stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE)
    stdout, stderr = proc.communicate()
    return proc.returncode, stdout, stderr


def safe_run_proc(command, error_message = "Execution failed"):
    logger.debug("Executing: %s" % str(command))
    exit_code, stdout, stderr = run_proc(command)
    if exit_code != 0:
        # TODO: streams are not string, but binary. Convert!
        raise DeploymentError("%s: %s" % (error_message, str(command)), exit_code, str(stdout), str(stderr))


def build_jekyll_site(repo_dir: str, jekyll_build_template: list) -> None:
    """Run Jekyll to build the site. The template should be a list of command components and one of them should
    contain the '{repo_dir}'. Examples are


    """
    # Bundler needs to be executed in a login shell.
    jekyll_command = list(map(lambda v: v.format(repo_dir=repo_dir), jekyll_build_template))
    safe_run_proc(jekyll_command)
    logger.info("Successfully built site with Jekyll in %s" % repo_dir)


def deploy_jekyll_site(repo_dir: str, served_dir: str) -> None:
    """Deploy the built site to the directories served by the HTTP server. Ensure correct access rights. Note that
    all served directory changes are overwritten!"""
    safe_run_proc(["rsync", "-rLv", "--delete", "%s/_site/" % repo_dir, "%s/" % served_dir])
    logger.info("Successfully synced '%s/_site' to '%s/'" % (repo_dir, served_dir))
    safe_run_proc(["chmod", "-R", "u=rwX,go=rX", "%s" % served_dir])
    logger.info("Successfully set served directory '%s' permissions" % served_dir)


def deployment_message(repo_url: str, remote_master_head_commit: str, repo_dir: str) -> str:
    return "Remote master HEAD commit %s not among currently pulled commits on master in %s. Deploying from %s!" % \
           (remote_master_head_commit, repo_dir, repo_url)


def rwx_dir(dir: str) -> bool:
    return os.path.isdir(dir) \
            and os.access(dir, os.R_OK | os.X_OK | os.W_OK)


def deploy_site(config_yaml: str) -> None:
    with open(config_yaml) as config_fh:
        config = yaml.load(config_fh, Loader=yaml.FullLoader)

    logger_conf = config["logging_yaml"]
    repository_dir = config["repository_dir"]
    deployment_dir = config["deployment_dir"]
    force_redeployment = config["force_redeployment"]
    branch = config["branch"]
    remote = config["remote"]
    github_owner = config["github_owner"]
    github_name = config["github_name"]
    site_url = config["site_url"]
    jekyll_build_template = config["jekyll_build_template"]

    github_url = "https://github.com/%s/%s" % (github_owner, github_name)

    if not rwx_dir(repository_dir):
        raise DeploymentError("Repository directory '%s' needs to be readable, writable & executable for '%s'" %
                              (repository_dir, getpass.getuser()))

    if not rwx_dir(deployment_dir):
        raise DeploymentError("Repository directory '%s' needs to be readable, writable & executable for '%s'" %
                              (repository_dir, getpass.getuser()))

    with open(logger_conf) as logger_conf_stream:
        logging.config.dictConfig(yaml.load(logger_conf_stream, Loader=yaml.FullLoader))

    repo = git.Repo(repository_dir)
    remote_master_head_commit = github_branch_head_commit(github_owner, github_name, branch)
    logger.debug("Remote %s/%s branch %s HEAD commit SHA: %s" %
                 (github_owner, github_name, branch, remote_master_head_commit))
    current_commits_in_ref = list_branch_commits(repo, branch)
    if force_redeployment or remote_master_head_commit not in current_commits_in_ref:
        logger.info(deployment_message(github_url, remote_master_head_commit, repository_dir))
        update_branch_from_remote(repo, branch, remote)
        build_jekyll_site(repository_dir, jekyll_build_template)
        deploy_jekyll_site(repository_dir, deployment_dir)
        logger.warning("Successfully deployed <%s|GitHub master> to the <%s|GHGA website>" % (github_url, site_url))
    else:
        logger.info("No remote updates.")


# The only global variable.
logger = logging.getLogger("ghga_updater")
if __name__ == "__main__":
    if len(argv) != 2:
        print("Please call: deploy-site.py config.yaml")
    try:
        deploy_site(argv[1])
    except Exception as ex:
        logger.error("Exception occurred: %s" % (repr(ex)))


