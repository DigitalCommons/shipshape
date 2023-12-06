# Ship-shape: Status information for the Digital Commons Co-operative's maps

This is a Gatsby generated website which shows sea-map and mykomap site information.

## Prerequisites

The hosting server must support a recent version of PHP, for the
back-end API script to run.

The building machine needs to have `node` and `npm` installed, and for
development `php-cli` needs to be installed to service the API endpoint.

## Backend

The backend is a simple PHP script which queries a sea-map or mykomap
site and generates JSON data describing it. It is deliberately fairly
simple.

[php/api/proxy.php][1]

## Front-end

The front-end is a React-based web UI. It queries the back-end and
displays the JSON data, with links to other resources.

## Development

   npm install
   npm run develop
   
This should build the site, and start a web server on
http://localhost:8000 which is live-updated when the source code is
modified.

It also runs a development PHP server on http://0.0.0.0:8080, to which
the React development server proxies.  Note, the public IP is
necessary to work around a limitation of the Gatsby proxy
implementation (`http-proxy-middleware`).

## Building

   npm install
   npm run build
   
The built assets are written to `public/`.

# Deploying

First, build as above. Then this will rsync the source code, and the
PHP backend, to the server:

   # Set the deployment target.
   npm config set shipshape:deploy_to dev-0:/var/www/vhosts/dev-0.solidarityeconomy.coop/www/shipshape
   npm run deploy

Note: The production website assumes it is deployed below the prefix path `/shipshape/`

[1]: ./php/api/sea-map.php
