import React, { useState, useEffect } from "react"
import { withPrefix } from "gatsby"
import Layout from "../components/layout"
import axios from "axios"
import sitesSummaryStyles from "../components/sitesSummary.module.scss"
import cn from "classnames"
import config from "../../config.js"
const sites = config.sites;

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

// Constructs a field specification
const mkFieldSpec = ({title, hint = null, accessor, sortWith, renderer}) => {
  return {
    title,
    hint,
    accessor,
    sorter: mkSorter(sortWith, accessor),
    renderer,
  };
};


// An ordered list of field specifications
const fields = [
  mkFieldSpec({
    title: "name",
    hint: "Site name",
    accessor: s => s.name,
    sortWith: stringSort,
    renderer: s => (
        <>
          <span>{s.name}</span>&nbsp;
          <a href={`data:application/json;base64,`+btoa(JSON.stringify(s,null,2))} rel="noreferrer" target="_blank">&#x2699;</a>
        </>
    ),
  }),
  mkFieldSpec({
    title: "server",
    hint: "Server name",
    accessor: s => s.server,
    sortWith: stringSort,
    renderer: s => (<a href={s.url} rel="noreferrer" target="_blank">{s.server}</a>),
  }),
  mkFieldSpec({
    title: "title",
    hint: "Site title",
    accessor: s => s.config.htmlTitle,
    sortWith: stringSort,
    renderer: s => s.config.htmlTitle,
  }),
  mkFieldSpec({
    title: "lat/lng",
    hint: "Default map location",
    accessor: s => s.config.defaultLatLng,
    sortWith: arySort(numSort),
    renderer: s => {
      const coords = s.config.defaultLatLng;
      if (!coords) return "-";
      return (
        <a href={`https://www.openstreetmap.org/#map=12/${coords.join('/')}`}
          rel="noreferrer" target="_blank">
          {s.config.defaultLatLng?.join(", ")}
        </a>
      )
    },
  }),
  mkFieldSpec({
    title: "sea-map version",
    hint: "Sea-map version in use",
    accessor: s => s.version.seaMapVersion,
    sortWith: stringSort,
    renderer: s => {
      const commit =
        s.version.seaMapResolvedVersion?.replace(/.*#/, '') ||
        s.version.seaMapVersion?.match(/_([^-]+)/)[1];
      const commitUrl = 'https://github.com/SolidarityEconomyAssociation/sea-map/' +
                  (commit ? 'commits/'+commit : '');
      return (
        <a href={commitUrl}
        rel="noreferrer" target="_blank">
        {s.version.seaMapVersion}
        </a>
      )
    },
  }),
  mkFieldSpec({
    title: "site deployed at",
    hint: "Site's deployment timestamp",
    accessor: s => s.version.timestamp,
    sortWith: stringSort,
    renderer: s => s.version.timestamp,
  }),
  mkFieldSpec({
    title: "dataset",
    hint: "Map datasets configured",
    accessor: s => s.config.namedDatasets,
    sortWith: arySort(stringSort),
    renderer: s => s.config.namedDatasets.join(", "),
  }),
  mkFieldSpec({
    title: "endpoint",
    hint: "SPARQL endpoint",
    accessor: s => s.endpoint,
    sortWith: stringSort,
    renderer: s => {
      // See
      // http://docs.openlinksw.com/virtuoso/rdfsparqlprotocolendpoint/
      // for how to construct this URL
      const usp = new URLSearchParams();
      usp.append("qtxt", s.query);
      usp.append("default-graph-uri", s.defaultGraphUri);
      const queryUrl = s.endpoint+'?'+usp.toString();
      return <a href={queryUrl} rel="noreferrer" target="_blank">{s.endpoint}</a>
    },
  }),
  mkFieldSpec({
    title: "DGU",
    hint: "SPARQL query default graph URI",
    accessor: s => s.defaultGraphUri,
    sortWith: stringSort,
    renderer: s => (<a href={s.defaultGraphUri} rel="noreferrer" target="_blank">{s.defaultGraphUri}</a>),
  }),
];

const SiteSummary = ({ siteInfo }) => {
  const value = (field) => {
    try {
      return field.renderer(siteInfo);
    }
    catch(_) {
      return '-';
    }
  };
  return (
    <tr>
      { fields.map(field => <td key={field.title}>{ value(field) }</td>) }
    </tr>
  );
}

const SitesSummary = ({ siteInfos, sortSitesBy }) => {
  const [sortState, setSortState] = useState({});
  
  const getClass = (col) => {
    if (col in sortState) {
      return cn(sitesSummaryStyles.sorted,
                sortState[col]? sitesSummaryStyles.ascending : sitesSummaryStyles.descending);
    }
    return sitesSummaryStyles.unsorted;
  };
  const mkSortHandler = (field) => () => {
    const sortOrder = !sortState[field.title];
    const newSortState = { [field.title]: sortOrder };
    setSortState(newSortState);
    sortSitesBy(field, sortOrder);
  };
  return (
    <div  className={sitesSummaryStyles.sitesSummary}>
      <table>
        <thead>
          <tr>
            { fields.map((field, ix) =>
                         <th
                           key={ix}
                           className={getClass(field.title)}
                           title={field.hint}
                           onClick={mkSortHandler(field)}>
                         {field.title}
                         </th>)
            }
          </tr>
        </thead>
        <tbody>
        { siteInfos.map((siteInfo, ix) => <SiteSummary key={ix} siteInfo={siteInfo} />) }
        </tbody>
      </table>
    </div>
  );
}

const emptySiteInfos = () => {
  const servers = Object.keys(sites.deployed).sort();
  return servers.map(server => {
    const siteUrls = sites.deployed[server];
    const names = Object.keys(siteUrls).sort();
    return names.map(name => ({
      url: siteUrls[name],
      name: name,
      server: server,
    }));
  }).flat();
}

const IndexPage = () => {  
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [siteInfos, setSiteInfos] = useState(emptySiteInfos());
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

  function fetchSites() {
    setLastRefresh(new Date());
    setSiteInfos(emptySiteInfos())
    siteInfos.forEach(async (site, ix) => {
      const newInfo = await fetchSite(site.url);
      const siteInfo = { ...site, ...newInfo }

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
    });
  }

  function sortSitesBy(field, isAscending = true) {
    const sorter = field.sorter[isAscending];
    //console.log("sortSitesBy", col, isAscending);

    setSiteInfos((oldSiteInfos) => {
      return oldSiteInfos.slice().sort(sorter);
    });
  }
  useEffect(() => {
    // Update the document title using the browser API
    fetchSites(emptySiteInfos());
  }, []);
  return (
    <Layout>
      <SitesSummary
        siteInfos={siteInfos}
        sortSitesBy={sortSitesBy} />
      <button onClick={() => fetchSites()} className={sitesSummaryStyles.refreshButton}>
        Refresh
      </button>
      <span>Last refresh: { lastRefresh.toLocaleString() }</span>
    </Layout>
  )
}
  
export default IndexPage
