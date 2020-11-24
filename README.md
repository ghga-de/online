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

  * Webserver (Apache, NGINX)
  * Python, virtualenv, pyyaml, gitpython
  * Ruby, Jekyll, jekyll-theme-slate

For setting up the site

  1. Install a web-server of your choice.
  2. Install `curl`, `git`, `python3`, and `rsync` with your OS package system
  2. Create a user without root permissions
      
     ```bash
     useradd -G ghga-web -H /home/ghga-web ghga-web
     usermod -L ghga-web  # Forbid login.
     ```

  3. Set the permissions on the deployment directory. This is necessary such that the new "ghga" user can deploy the site on the webserver. The rwx-permissions are checked by the script on the auto-deployment repo-clone and the target deployment directory.
    
     `chmod g+rwX -R /var/www/html`
    
  4. Install software. 

     1. Follow the [instructions](http://rvm.io/rvm/install) for installing RVM
     2. Install
     
        ```bash
        rvm install ruby-2.7.0
        gem install bundler
        ```

    * Ruby, Bundler, Jekyll, Bash
     * pip
    * gitpython
    * pyyaml

     E.g. for a native installation on CentOS

     ```bash
     # Install RVM.
     curl -sSL https://get.rvm.io | bash -s stable

     ```
  
  3. Clone the repository

     `git clone ... /home/ghga/ghga-de`
  
  4. Create `logging.yaml` and `config.yaml` from the templates in the `src/` directory.
    
  5. Test the deployment script
     > TODO Add test call; use force-redeploy
  
  6. Set up a cron-job
     > TODO Add cron example

### Notes
 
  * You should never modify the auto-deployment clone. Currently, the script will do a `git pull --force` on the branch and all local changes will be overwritten without warning.
  * You should also never modify the deployment directory, because also there all local changes will be overwritten.
  * Slack notifications can be send. You'll need the [webhook](https://api.slack.com/messaging/webhooks) app in Slack and add the submission URL to the `logging.yaml`. In the YAML you can also configure the logging level of issues going into Slack notifications. E.g. if you configure WARNING, then WARNING and ERROR messages go to Slack.
  * The master will only be updated if the remote branch HEAD is newer than the local branch HEAD (specifically, if the remote HEAD is on a commit that is not found in the local branch). 
 
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

