#!/bin/bash

set -x

# Get the defaults
for val in user group to; do
    # Work around the loss of the ability for .npmrc to override
    # npm_package_config_* environment variables:
    # https://github.com/npm/rfcs/blob/main/implemented/0021-reduce-lifecycle-script-environment.md
    export "npm_package_config_deploy_$val=$(npm config get shipshape:deploy_$val)"
done
deploy_user=${npm_package_config_deploy_user:?No config.deploy_user setting in package.json}
deploy_group=${npm_package_config_deploy_group:?No config.deploy_group setting in package.json}
deploy_from=(public/ php/)
deploy_to=${npm_package_config_deploy_to:?No config.deploy_to setting in package.json}

rsync -avzc \
      --delete \
      --rsync-path='sudo rsync' \
      --usermap="*:$deploy_user" \
      --groupmap="*:$deploy_group" \
      "${deploy_from[@]}" \
      --exclude=*~ \
      "$deploy_to"
