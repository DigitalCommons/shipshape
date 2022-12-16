<?php // -*- php -*-

/** sea-map
 *
 * Gets the config/version and other data about a sea-map website,
 * given the URL as the `url` parameter.
 *
 */


function text($url, $default = NULL) {
    $contents = file_get_contents($url);
    if ($contents === false) {
        if ($default === NULL)
            throw new Exception("Failed to get URL: $url");
        else
            return $default;
    }
    return $contents;
}


function json($url, $default = NULL) {
    $contents = file_get_contents($url);
    if ($contents === false) {
        if ($default === NULL)
            throw new Exception("Failed to get URL: $url");
        else
            return $default;
    }
    return json_decode($contents, true);
}

// Adapted from https://stackoverflow.com/a/7555543
function get_redirected_url($url) {
    $context = stream_context_create(array(
        'http' => array(
            'method' => 'HEAD'
        )
    ));
    $headers = get_headers($url, 1, $context);
    if ($headers !== false && isset($headers['Location'])) {
        if(is_array($headers['Location'])){
            return array_pop($headers['Location']);
        }
        return $headers['Location'];
    }
    return false;
}

function inspect_site($url) {

    $config = json("$url/configuration/config.json");
    $version = json("$url/configuration/version.json", []);
    
    $dataset = $config["namedDatasets"][0];

    $endpoint = text("$url/configuration/$dataset/endpoint.txt", "");
    $dgu = text("$url/configuration/$dataset/default-graph-uri.txt", "");
    $query = text("$url/configuration/$dataset/query.rq", "");

    $index_url = get_redirected_url("$dgu/");
    try {
        $meta_url = substr_replace($index_url, "meta.json", -9);
        $meta = json($meta_url);
    }
    catch(Exception $e) {
        $meta = [];
    }
    
    return ['url' => $url,
            'config' => $config,
            'version' => $version,
            'endpoint' => $endpoint,
            'defaultGraphUri' => $dgu,
            'query' => $query,
            'meta_url' => $meta_url,
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

