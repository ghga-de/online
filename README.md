# German Human Genome-Phenome Archive (GHGA) Website

## Developers & Testers

The site uses Jekyll. To test the website locally, follow the instructions in the Github <a href="https://help.github.com/en/github/working-with-github-pages/testing-your-github-pages-site-locally-with-jekyll" target="_blank">Help</a>.

Essentially, you need an installation of Jekyll. If you use Bundler you can start the website locally with

```bash
cd ghga-de_online    # or however you called the repository dir
bundle exec jekyll serve
```

Then point your browser to the local address displayed in the output of the command. That's it!
 
## Website Deployment

The auto-deployment script `src/deploy-site.py` can be called via a cron-job on the website server. It will then regularly check the Github repo for changes, deploy the site if necessary, and optionally send a message to Slack.

> TODO Fix dependency docs as soon as the mode of installation is clarified.

The script needs

    * Ruby, Bundler, Jekyll, Bash
    * Git
    * gitpython
    * pyyaml

The following conditions must be met

  * The target directory, to which the deployment is done must be writable and owned by the user doing the deployment. Check `chmod go=rX -R $deploymentDir`. The rwx-permissions are checked on the auto-deployment repo-clone and the target deployment directory.

> TODO Add cron example & script-call to illustrate the usage.

Furthermore note:
 
  * You should never modify the auto-deployment clone. Currently, the script will do a `git pull --force` on the branch and all local changes will be overwritten without warning.
  * You should also never modify the deployment directory, because also there all local changes will be overwritten.
  * Slack notifications can be send for WARNING and ERROR level messages. You'll need the [webhook](https://api.slack.com/messaging/webhooks) app in slack and add the submission URL to the `logging.yaml`. 
  * The master will only be updated if the remote branch HEAD is newer than the local branch HEAD (specifically, if it is on a commit, that is not found in the local branch). 
 
## Licence

The repository includes the following libraries:

  * [Bootstrap](https://github.com/twbs/bootstrap) (MIT)
  * [Bootstrap Grayscale Theme](https://github.com/twbs/bootstrap) (Apache 2.0)
  * [Fontawesome](https://github.com/FortAwesome/Font-Awesome) (Font Awesome Free Licence)
  * [MithrilJS](https://github.com/MithrilJS/mithril.js) (MIT)
  * [Lodash](https://github.com/lodash/lodash) (MIT)
  * [jQuery](https://github.com/jquery/jquery) (MIT)
  * [i18next](https://github.com/i18next/i18next) (MIT)
  * [i18next-http-backend](https://github.com/i18next/i18next-http-backend) (MIT)
  * [i18next-browser-languageDetector](https://github.com/i18next/i18next-browser-languageDetector) (MIT)
  * [jquery-i18next](https://github.com/i18next/jquery-i18next) (MIT)

