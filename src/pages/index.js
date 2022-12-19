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

// Constructs a field specification
const mkFieldSpec = ({title, hint = null, sortWith}) => {
  return {
    title,
    hint,
    comparer: sortWith,
  };
};


// An ordered list of data table field specifications
const fields = [
  mkFieldSpec({
    title: "name",
    hint: "Site name",
    sortWith: stringSort,
  }),
  mkFieldSpec({
    title: "server",
    hint: "Server name",
    sortWith: stringSort,
  }),
  mkFieldSpec({
    title: "title",
    hint: "Site title",
    sortWith: stringSort,
  }),
  mkFieldSpec({
    title: "lat/lng",
    hint: "Default map location",
    sortWith: arySort(numSort),
  }),
  mkFieldSpec({
    title: "sea-map version",
    hint: "Sea-map version in use",
    sortWith: stringSort,
  }),
  mkFieldSpec({
    title: "site deployed at",
    hint: "Site's deployment timestamp",
    sortWith: stringSort,
  }),
  mkFieldSpec({
    title: "dataset",
    hint: "Map datasets configured",
    sortWith: arySort(stringSort),
  }),
  mkFieldSpec({
    title: "endpoint",
    hint: "SPARQL endpoint",
    sortWith: stringSort,
  }),
  mkFieldSpec({
    title: "DGU",
    hint: "SPARQL query default graph URI",
    sortWith: stringSort,
  }),
];

// Constructor for an SiteInfo field interpreter
const mkInterpreter = ({accessor, renderer}) => ({
  accessor, renderer
});


const renderVersion = (version, resolvedVersion, baseCommitUrl) => {
  let commit = resolvedVersion?.replace(/.*#/, '')
  if (!commit) {
    const match = version?.match(/_([^-]+)/);
    if (match && match.length > 1)
      commit = match[1];
    else
      commit = `v${version}`
  }
  const commitUrl = baseCommitUrl +
                    (commit ? 'commits/'+commit : '');
  return (
    <a href={commitUrl}
      rel="noreferrer" target="_blank">
      {version}
    </a>
  )
};

// SiteInfo interpreters for sea-map v0.x and v1.x sites.
// Keys must match the titles of the field specifications in fields
const interpreters1 = {
  "name": mkInterpreter({
    accessor: s => s.name,
    renderer: s => (
        <>
          <span>{s.name}</span>&nbsp;
          <a href={`data:application/json;base64,`+btoa(JSON.stringify(s,null,2))} rel="noreferrer" target="_blank">&#x2699;</a>
        </>
    ),
  }),
  "server": mkInterpreter({
    accessor: s => s.server,
    renderer: s => (<a href={s.url} rel="noreferrer" target="_blank">{s.server}</a>),
  }),
  "title": mkInterpreter({
    accessor: s => s.config.htmlTitle,
    renderer: s => s.config.htmlTitle,
  }),
  "lat/lng": mkInterpreter({
    accessor: s => s.config.defaultLatLng,
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
  "sea-map version": mkInterpreter({
    accessor: s => s.version.seaMapVersion,
    renderer: s => renderVersion(s.version.seaMapVersion,
                                 s.version.seaMapResolvedVersion,
                                 'https://github.com/SolidarityEconomyAssociation/sea-map/'),
  }),
  "site deployed at": mkInterpreter({
    accessor: s => s.version.timestamp,
    renderer: s => s.version.timestamp,
  }),
  "dataset": mkInterpreter({
    accessor: s => s.config.namedDatasets,
    renderer: s => s.config.namedDatasets.join(", "),
  }),
  "endpoint": mkInterpreter({
    accessor: s => {
      const name = s.config.namedDatasets[0];
      return s.datasets[name].endpoint;
    },
    renderer: s => {
      // See
      // http://docs.openlinksw.com/virtuoso/rdfsparqlprotocolendpoint/
      // for how to construct this URL
      const name = s.config.namedDatasets[0];
      const d = s.datasets[name];
      const usp = new URLSearchParams();
      usp.append("qtxt", d.query);
      usp.append("default-graph-uri", d.defaultGraphUri);
      const queryUrl = d.endpoint+'?'+usp.toString();
      return <a href={queryUrl} rel="noreferrer" target="_blank">{d.endpoint}</a>
    },
  }),
  "DGU": mkInterpreter({
    accessor: s => {
      const name = s.config.namedDatasets[0];
      return s.datasets[name].defaultGraphUri;
    },
    renderer: s => {
      const name = s.config.namedDatasets[0];
      const d = s.datasets[name];
      return (<a href={d.defaultGraphUri} rel="noreferrer" target="_blank">{d.defaultGraphUri}</a>);
    },
  }),
};


// SiteInfo interpreters for sea-map v2.x sites. These didn't export
// site info!
//
// Keys must match the titles of the field specifications in fields.
const interpreters2 = {
  ...interpreters1,
  "sea-map version": mkInterpreter({
    accessor: s => '2',
    renderer: s => '2.x',
  }),
  "site deployed at": mkInterpreter({
    accessor: s => '',
    renderer: s => 'unknown',
  }),
};


// SiteInfo interpreters for sea-map v3.x, renamed to mykomap.
// Keys must match the titles of the field specifications in fields.
const interpreters3 = {
  ...interpreters1,
  "sea-map version": mkInterpreter({
    accessor: s => s.config.mykoMapVersion,
    renderer: s => renderVersion(s.config.mykoMapVersion,
                                 s.config.mykoMapResolvedVersion,
                                 'https://github.com/DigitalCommons/mykomap/'),
  }),
  "site deployed at": mkInterpreter({
    accessor: s => s.config.timestamp,
    renderer: s => s.config.timestamp,
  }),
};




// Given the info from a site (minus the name, url, etc.)
// infer what version the info is and return an appropriate set of
// field interpreters (which supply a uniform value accessor for sorting,
// and renderer for display)
const mkFieldInterpreters = (newInfo) => {
  const seaMapVersion = newInfo.version?.seaMapVersion?.split(/[.]/);
  const mykoMapVersion = newInfo.config?.mykoMapVersion?.split(/[.]/);
  if (mykoMapVersion)
    return interpreters3; // Must be a mykomap
  if (seaMapVersion)
    return interpreters1; // Must be a sea-map v0.x or v1.x

  // Must be a sea-map v2.x or mykomap v3.0 (in which neither
  // version.json nor config.json is not present). Same outcome.
  return interpreters2;   
};

const SiteSummary = ({ siteInfo }) => {
  const value = (field) => {
    try {
      if (typeof siteInfo === 'object' && Object.keys(siteInfo).length > 3) {
        const interpreter = siteInfo._interpreters[field.title];
        return interpreter.renderer(siteInfo);
      }
      else
        return '-'
    }
    catch(e) {
      console.debug(`error rendering field '${field.title}' for site '${siteInfo.name}': ${e}`);
      return 'x';
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

      // Work out what version of the info is returned, and provide
      // interpreters which decode the newInfo in a uniform way.
      const fieldInterpreters = mkFieldInterpreters(newInfo); 

      const siteInfo = { ...site, ...newInfo, _interpreters: fieldInterpreters }

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
    //console.log("sortSitesBy", col, isAscending);

    setSiteInfos((oldSiteInfos) => {
      // Schwartzian transform sort: pre-compute the values we sort
      // on, pair with the siteInfos.
      const sortablePairs = oldSiteInfos.map(
        // Each siteInfo has an _interpreters field which indexes the
        // appropriate value accessors for each field
        si => [si, safeInvoke(() => si._interpreters[field.title].accessor(si))]
      );

      // Make a comparer which operates on these pairs
      const comparer = mkSafeComparer(field.comparer, pair => pair[1], isAscending);

      // Sort the pairs
      const sortedPairs = sortablePairs.sort(comparer);

      // Return the unpaired siteInfos
      return sortedPairs.map(pair => pair[0]);
    });
  }
  useEffect(() => {
    // This triggers the initial update of the data
    fetchSites(); 
  });
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
