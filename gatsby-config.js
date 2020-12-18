const package_json = require('./package.json');

module.exports = {
  siteMetadata: {
    title: `Ship-Shape`,
    description: package_json.description,
    siteUrl: package_json.homepage,
  },
  pathPrefix: '/shipshape',
  plugins: [
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
        name: `Ship-Shape SEA`,
        short_name: `Shape-Shape`,
        start_url: `/`,
        background_color: `white`,
        theme_color: `#0bb696`,
        display: `minimal-ui`,
        icon: `src/images/sea-icon.png`, // This path is relative to the root of the site.
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    `gatsby-plugin-offline`,
  ],
  proxy: {
    prefix: "/api",
    url: "http://localhost:8080",
  },
}
