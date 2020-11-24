# German Human Genome-Phenome Archive (GHGA) Website

## Developers & Testers

The repo is delivered with a [Conda](https://docs.conda.io/en/latest/miniconda.html) environment YAML that contains all dependencies. You can set everything by installing Conda, and then do

```bash
git clone https://github.com/ghga-de/online.git ghga-de/
conda env create -n ghga-de -f ghga-de/environment.yaml
```

The site uses Jekyll. You can also install Jekyll manually as described in the <a href="https://help.github.com/en/github/working-with-github-pages/testing-your-github-pages-site-locally-with-jekyll" target="_blank">Jekyll documentation</a>. 

If you use Bundler you can start the website locally with

```bash
cd ghga-de    # or however you called the repository dir
bundle exec jekyll serve
```

Then point your browser to the local address displayed in the output of the command. That's it!
 
## Website Deployment

The auto-deployment script `ghga-de/src/deploy-site.py` can be called manually or via a cron-job on the website server. It will check the Github repo for changes, deploy the site if necessary, and optionally send a message to Slack.

For setting up the site

  1. Install a web-server of your choice.
  2. Create a user without root permissions
      
     ```bash
     useradd -G ghga-web -H /home/ghga-web ghga-web
     usermod -L ghga-web  # Forbid login.
     ```

  3. Set the permissions on the deployment directory. This is necessary such that the new "ghga" user can deploy the site on the webserver. The rwx-permissions are checked by the script on the auto-deployment repo-clone and the target deployment directory.
    
     `chmod g+rwX -R /var/www/html`
    
  4. As deployment-user clone the repository

     `git clone ... /home/ghga/ghga-de`
     
  5. Install [Miniconda](https://docs.conda.io/en/latest/miniconda.html)
  
  6. Install the Conda environment
          
     ```bash
     conda env create -n ghga-de -f ghga-de/environment.yaml
     ```  
  
  4. Create `logging.yaml` and `config.yaml` from the templates in the `src/` directory. Please make copies outside the repository, because all changes in the deployment-repository will be overwritten!
    
  5. For manual deployment you can run the deployment script with your `config.yaml` as only parameter.
  
     ```bash
     python ghga/src/deploy-site.py config.yaml
     ```
  
  6. \[Optional] Set up a cron-job for automatic deployment
  
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

