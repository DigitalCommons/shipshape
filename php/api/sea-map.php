<?php // -*- php -*-

/** sea-map
 *
 * Gets the config/version and other data about a sea-map website,
 * given the URL as the `url` parameter.
 *
 */


function text($url) {
    $contents = file_get_contents($url);
    if ($contents === False)
        throw new Exception("Failed to get URL: $url");
    return $contents;
}


function json($url) {
    return json_decode(text($url), true);
}

function inspect_site($url) {

    $config = json("$url/configuration/config.json");
    $version = json("$url/configuration/version.json");
    
    $dataset = $config["namedDatasets"][0];

    $endpoint = text("$url/configuration/$dataset/endpoint.txt");
    $dgu = text("$url/configuration/$dataset/default-graph-uri.txt");
    $query = text("$url/configuration/$dataset/query.rq");

    $meta = [];
    try {
        $meta = json("$dgu/meta.json");
    }
    catch(Exception $e) {}
    
    return ['url' => $url,
            'config' => $config,
            'version' => $version,
            'endpoint' => $endpoint,
            'defaultGraphUri' => $dgu,
            'query' => $query,
            'meta' => $meta];
}
            
$url = $_GET['url'];
header('Content-type: application/json');
try {
    if (!$url) throw new Exception("no url parameter");
    print json_encode(inspect_site($url));
} catch(Exception $e) {
    print json_encode(['error' => $e->getMessage()]);
}

