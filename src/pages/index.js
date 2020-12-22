import React, { useState, useEffect } from "react"
import { withPrefix } from "gatsby"
import Layout from "../components/layout"
import axios from "axios"
import sitesSummaryStyles from "../components/sitesSummary.module.scss"
import cn from "classnames"

const sites = {
  deployed: {
    "dev-0": {
      "coopsuk": "https://dev.coopsuk.solidarityeconomy.coop",
      "dotcoop-project": "https://dev.dotcoop.solidarityeconomy.coop",
      "ica-project": "https://dev.ica.solidarityeconomy.coop",
      "mutual-aid-project": "https://dev.mutual-aid.solidarityeconomy.coop",
      "newbridge-project": "https://dev.newbridge.solidarityeconomy.coop",
      "oxford-project": "https://dev.oxford.solidarityeconomy.coop",
      "mersey-green-project": "https://dev.mersey-green.solidarityeconomy.coop",
    },
    
    "prod-0": {
      "coopsuk": "https://prod.coopsuk.solidarityeconomy.coop",
      "dotcoop-project": "https://prod.dotcoop.solidarityeconomy.coop",
      "ica-project": "https://prod.ica.solidarityeconomy.coop",
      "mutual-aid-project": "https://prod.mutual-aid.solidarityeconomy.coop",
      "newbridge-project": "https://prod.newbridge.solidarityeconomy.coop",
      "oxford-project": "https://prod.oxford.solidarityeconomy.coop",
      "mersey-green-project": "https://prod.mersey-green.solidarityeconomy.coop",
   },
  },
};

const siteSummaryColumns = [
  "url", "title", "lat/lng", "timestamp", "gitcommit", "dataset", "endpoint", "DGU"
];

// Accessor functions for the raw values to show in each column
// See htmlFieldMap for the HTML-ised version.
const fieldMap = {
  "url": s => s.url,
  "title": s => s.config.htmlTitle,
  "lat/lng": s => s.config.defaultLatLng,
  "timestamp": s => s.version.timestamp,
  "gitcommit": s => s.version.gitcommit,
  "dataset": s => s.config.namedDatasets,
  "endpoint": s => s.endpoint,
  "DGU" : s => s.defaultGraphUri,
};

// Various sort functions. Reminder: compare(a, b) functions should return
// -1 if a is before b, 1 if it is after, and 0 if they are equal.

const stringSort = (a, b) => String(a).localeCompare(String(b));

const numSort = (a, b) => Math.sign(Number(a) - Number(b));

const arySort = (compare) => (a, b) => {
  // handle non-arrays
  if (!Array.isArray(a)) a = [];
  if (!Array.isArray(b)) b = [];

  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;
  
  let ix = 0;
  while (ix < a.length) {
    const comparison = compare(a[ix], b[ix]);
    if (comparison)
      return comparison;
    ix += 1;
  }
  return 0;
}

// Calls a function, but eats errors
const safeInvoke = (func, msg = "silenced error") => {
  try { return func() }
  catch(_) {
    //console.debug(msg, _, _.stack);
    return undefined;
  }
}

// Make a comparison function which compares using compare and accessor,
// but eats errors 
const mkSafeComparer = (comparer, accessor, invert = false) => {
  
  return (a, b) => {
    const va = safeInvoke(() => accessor(a));
    const vb = safeInvoke(() => accessor(b));
    return invert? comparer(va, vb) : comparer(vb, va);
  }
}

// A returns an object with a pre-generated forward and reverse comparer
// using the given basic value comparer and value accessor
const mkSorter = (comparer, accessor) => ({
  true: mkSafeComparer(comparer, accessor, true),
  false: mkSafeComparer(comparer, accessor, false),
});


// Maps each column title to a sorter function for that column
const sortFieldMap = {
  "url": mkSorter(stringSort, fieldMap.url),
  "title": mkSorter(stringSort, fieldMap.title),
  "lat/lng": mkSorter(arySort(numSort), fieldMap["lat/lng"]),
  "timestamp": mkSorter(stringSort, fieldMap.timestamp),
  "gitcommit": mkSorter(stringSort, fieldMap.gitcommit),
  "dataset": mkSorter(arySort(stringSort), fieldMap.dataset),
  "endpoint": mkSorter(stringSort, fieldMap.endpoint),
  "DGU" : mkSorter(stringSort, fieldMap.DGU),
};

// Functions to generate the html value in columns
const htmlFieldMap = {
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
      return htmlFieldMap[col](siteInfo);
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

const SitesSummary = ({ siteInfos, sortSitesBy }) => {
  const [sortState, setSortState] = useState({});
  
  // FIXME css modulize
  const getClass = (col) => {
    if (col in sortState) {
      return cn(sitesSummaryStyles.sorted,
                sortState[col]? sitesSummaryStyles.ascending : sitesSummaryStyles.descending);
    }
    return sitesSummaryStyles.unsorted;
  };
  const mkSortHandler = (col) => () => {
    const sortOrder = !sortState[col];
    const newSortState = { [col]: sortOrder };
    setSortState(newSortState);
    sortSitesBy(col, sortOrder);
  };
  return (
    <table>
      <thead>
        <tr>
          { siteSummaryColumns.map(col =>
                                   <th
                                     key={col}
                                     className={getClass(col)}
                                     onClick={mkSortHandler(col)}>
                                     {col}
                                   </th>)
          }
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

  function sortSitesBy(col, isAscending = true) {
    const sorter = sortFieldMap[col][isAscending];
    //console.log("sortSitesBy", col, isAscending);

    setSiteInfos((oldSiteInfos) => {
      return oldSiteInfos.slice().sort(sorter);
    });
  }
  useEffect(() => {
    // Update the document title using the browser API
    fetchSites(siteUrls);
  }, []);
  return (
    <Layout>
      <SitesSummary
        siteInfos={siteInfos}
        sortSitesBy={sortSitesBy} />
      <button onClick={() => fetchSites(siteUrls)} className={sitesSummaryStyles.refreshButton}>
        Refresh
      </button>
      <span>Last refresh: { lastRefresh.toLocaleString() }</span>
    </Layout>
  )
}
  
export default IndexPage
