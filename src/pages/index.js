import React, { useState, useEffect } from "react"
import { withPrefix } from "gatsby"
import Layout from "../components/layout"
import axios from "axios"

const sites = {
  paths: {
    "coopsuk@dev-0": "/var/www/vhosts/coopsuk.solidarityeconomy.coop/www",
    "dotcoop-project@dev-0": "/var/www/vhosts/dotcoop.solidarityeconomy.coop/www",
    "ica-project@dev-0": "/var/www/vhosts/ica.solidarityeconomy.coop/www",
    "mutual-aid-project@dev-0": "/var/www/vhosts/mutual-aid.solidarityeconomy.coop/www",
    "newbridge-project@dev-0": "/var/www/vhosts/newbridge.solidarityeconomy.coop/www",
    "oxford-project@dev-0": "/var/www/vhosts/oxford.solidarityeconomy.coop/www",

    "coopsuk@prod-0": "/var/www/vhosts/coopsuk.solidarityeconomy.coop/www",
    "dotcoop-project@prod-0": "/var/www/vhosts/dotcoop.solidarityeconomy.coop/www",
    "ica-project@prod-0": "/var/www/vhosts/ica.solidarityeconomy.coop/www",
    "mutual-aid-project@prod-0": "/var/www/vhosts/mutual-aid.solidarityeconomy.coop/www",
    "newbridge-project@prod-0": "/var/www/vhosts/newbridge.solidarityeconomy.coop/www",
    "oxford-project@prod-0": "/var/www/vhosts/oxford.solidarityeconomy.coop/www",    
  },

  deployed: {
    "dev-0": {
      "coopsuk": "https://dev.coopsuk.solidarityeconomy.coop",
      "dotcoop-project": "https://dev.dotcoop.solidarityeconomy.coop",
      "ica-project": "https://dev.ica.solidarityeconomy.coop",
      "mutual-aid-project": "https://dev.mutual-aid.solidarityeconomy.coop",
      "newbridge-project": "https://dev.newbridge.solidarityeconomy.coop",
      "oxford-project": "https://dev.oxford.solidarityeconomy.coop",
    },
    
    "prod-0": {
      "coopsuk": "https://prod.coopsuk.solidarityeconomy.coop",
      "dotcoop-project": "https://prod.dotcoop.solidarityeconomy.coop",
      "ica-project": "https://prod.ica.solidarityeconomy.coop",
      "mutual-aid-project": "https://prod.mutual-aid.solidarityeconomy.coop",
      "newbridge-project": "https://prod.newbridge.solidarityeconomy.coop",
      "oxford-project": "https://prod.oxford.solidarityeconomy.coop",
    },
  },
};

const siteSummaryColumns = [
  "url", "title", "lat/lng", "timestamp", "gitcommit", "dataset", "endpoint", "DGU"
];

const fieldMap = {
  "url": s => <a href={s.url} rel="noreferrer" target="_blank">{s.url}</a>,
  "title": s => s.config.htmlTitle,
  "lat/lng": s => s.config.defaultLatLng?.join(", "),
  "timestamp": s => s.version.timestamp,
  "gitcommit": s => s.version.gitcommit,
  "dataset": s => s.config.namedDatasets.join(", "),
  "endpoint": s => {
    // See
    // http://docs.openlinksw.com/virtuoso/rdfsparqlprotocolendpoint/
    // for how to construct this URL
    const usp = new URLSearchParams();
    usp.append("qtxt", s.query);
    usp.append("default-graph-uri", s.defaultGraphUri);
    const queryUrl = s.endpoint+'?'+usp.toString();
    return <a href={queryUrl} rel="noreferrer" target="_blank">{s.endpoint}</a>
  },
  "DGU" : s => <a href={s.defaultGraphUri} rel="noreferrer" target="_blank">{s.defaultGraphUri}</a>,
};

const SiteSummary = ({ siteInfo }) => {
  const value = (col) => {
    try {
      return fieldMap[col](siteInfo);
    }
    catch(_) {
      return '-';
    }
  };
  return (
    <tr>
      { siteSummaryColumns.map(col => <td key={col}>{ value(col) }</td>) }
    </tr>
  );
}

const SitesSummary = ({ siteInfos }) => {
  return (
    <table>
      <thead>
        <tr>
          { siteSummaryColumns.map(col => <th key={col}>{col}</th>) }
        </tr>
      </thead>
      <tbody>
      { siteInfos.map((siteInfo, ix) => <SiteSummary key={ix} siteInfo={siteInfo} />) }
      </tbody>
    </table>
  );
}

const servers = Object.keys(sites.deployed).sort();
const siteUrls = servers.map(server => {
  const siteUrls = sites.deployed[server];
  const labels = Object.keys(siteUrls).sort();
  return labels.map(label => siteUrls[label]);
}).flat();

const emptySiteInfos = siteUrls.map(url => ({url: url}));


const IndexPage = () => {  
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [siteInfos, setSiteInfos] = useState(emptySiteInfos);
  const apiUrl = withPrefix('/api/sea-map.php');
  async function fetchSite(siteUrl) {
    const url = `${apiUrl}?url=${siteUrl}`;
    console.log("fetching", url);
    try {
      const response = await axios.get(url);
      console.log("got", url);
      return response.data;
    } catch (e) {
      return {error: e.message, stack: e.stack, url: url};
    }
  }

  function fetchSites(siteUrls) {
    setLastRefresh(new Date());
    Promise.all(siteUrls.map(async (url, ix) => {
      const siteInfo = await fetchSite(url)

      // Update siteInfos asynchronously
      setSiteInfos((oldSiteInfos) => {
        //console.log("before",ix, oldSiteInfos);
        const newSiteInfos = oldSiteInfos.slice();
        while(newSiteInfos.length < ix+1) {
          newSiteInfos.push({})
        }
        newSiteInfos[ix] = siteInfo;
        //console.log("after",ix, newSiteInfos);
        return newSiteInfos;
      });
    }));
  }
  useEffect(() => {
    // Update the document title using the browser API
    fetchSites(siteUrls);
  }, []);
  return (
    <Layout>
      <SitesSummary siteInfos={siteInfos} />
      <button onClick={() => fetchSites(siteUrls)}>
        Refresh
      </button>
      <span>Last refresh: { lastRefresh.toLocaleString() }</span>
    </Layout>
  )
}
  
export default IndexPage
