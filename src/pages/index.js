import React, { useState, useEffect } from "react"
import { withPrefix } from "gatsby"
import Layout from "../components/layout"
import axios from "axios"


const IndexPage = () => {
  const [site, setSite] = useState({pending: true});
  const apiUrl = withPrefix('/api/sea-map.php');
  const siteUrl = 'https://dev.ica.solidarityeconomy.coop';
  async function fetchSite(siteUrl) {
    const url = `${apiUrl}?url=${siteUrl}`;
    console.log("fetching", url);
    try {
      const response = await axios.get(url);
      setSite(response.data)
    } catch (e) {
      setSite({error: e.message, stack: e.stack, url: url});
    }
  }
  useEffect(() => {
    // Update the document title using the browser API
    fetchSite(siteUrl);
  }, []);
  return (
    <Layout>
      <h1>SEA Infrastructure</h1>
      <pre>{ JSON.stringify(site, null, 2) }</pre>
      <button onClick={() => fetchSite(siteUrl)}>
        Refresh
      </button>
    </Layout>
  )
}
  
export default IndexPage
