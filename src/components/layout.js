/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import Helmet from "react-helmet"
import Header from "./header"
import "./layout.css"
import * as sitesSummaryStyles from "./sitesSummary.module.scss"

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <div className={sitesSummaryStyles.pageWrapper}>
      <Header siteTitle={data.site.siteMetadata.title} />
      <Helmet
        title={data.site.siteMetadata.title}
        meta={[
            { name: 'description', content: data.site.siteMetadata.title },
        ]} />
       <main>{children}</main>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
