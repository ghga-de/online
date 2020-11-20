#!/usr/bin/env python3

from urllib.request import Request, urlopen
import json
import yaml
import git
import logging.config
import subprocess
from sys import argv


class DeploymentError(Exception):
    pass


def github_branch_head_commit(repo_owner: str, repo_name: str, branch_name: str, error_handler) -> str:
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


def build_jekyll_site(repo_dir: str) -> None:
    """Run Jekyll to build the site."""
    # Bundler needs to be executed in a login shell.
    jekyll_command = ["bash", "-l", "-c", "cd '%s' && bundle exec jekyll build" % repo_dir]
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


def handle_error(code: int, reason: str) -> None:
    print(code)
    print(reason)
    ## TODO Message to Slack



# Requirements
#   ruby, bundler, jekyll, bash
#   git
#   systemd (centos)
#   gitpython
#   pyyaml
#   The target directory, to which the deployment is done must be writable and owned by the user doing the deployment.
#   Check `chmod go=rX -R $deploymentDir`
#
# Notes
# - never modify the auto-deployment clone; changes will be overwritten (with warning log)
# - changes in the deployment directory will be overwritten (with warning log)
# - checking out something else then the master HEAD will be ignored, this just checks the master head (checkout out or
#   not), an update only happens if the local master is older than the remote master

# TODO Test deployment to some arbitrary directory
# TODO Daemon mode. Use some scheduler, to schedule this task once every quarter of an hour, or so.
# TODO Write systemd script
# TODO Log events to Slack

branch = "master"
remote = "origin"
github_owner = "ghga-de"
github_name = "online"
github_url = "https://github.com/%s/%s" % (github_owner, github_name)
server_url = "https://ghga.de"
logger_conf = argv[1]
repo_dir = argv[2]
served_dir = argv[3]

# TODO Test whether server_dir exists
# TODO Test whether repo_dir exists
with open(logger_conf) as logger_conf_stream:
    logging.config.dictConfig(yaml.load(logger_conf_stream, Loader=yaml.FullLoader))

logger = logging.getLogger("root")

try:
    repo = git.Repo(repo_dir)
    remote_master_head_commit = github_branch_head_commit(github_owner, github_name, branch, handle_error)
    logger.debug("Remote %s/%s branch %s HEAD commit sha: %s" %
                 (github_owner, github_name, branch, remote_master_head_commit))
    current_commits_in_ref = list_branch_commits(repo, branch)
    if True or remote_master_head_commit not in current_commits_in_ref:
        logger.info(deployment_message(github_url, remote_master_head_commit, repo_dir))
        update_branch_from_remote(repo, branch, remote)
        build_jekyll_site(repo_dir)
        deploy_jekyll_site(repo_dir, served_dir)
        logger.warning("Successfully deployed %s to %s" % (github_url, server_url))
    else:
        logger.info("No remote updates.")
except Exception as ex:
    logger.error("Exception occurred: %s" % (repr(ex)))
