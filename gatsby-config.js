const package_json = require('./package.json');

module.exports = {
  siteMetadata: {
    title: `Ship-Shape`,
    description: package_json.description,
    siteUrl: package_json.homepage,
  },
  pathPrefix: '/shipshape',
  plugins: [
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        implementation: require("sass"),
      },
    },
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Ship-Shape DCC`,
        short_name: `Shape-Shape`,
        start_url: `/`,
        background_color: `white`,
        theme_color: `#5d4d97`,
        display: `minimal-ui`,
        icon: `src/images/dcc-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    //`gatsby-plugin-offline`,
  ],
  proxy: {
    prefix: "/api",
    url: "http://0.0.0.0:8080",
  },
}
