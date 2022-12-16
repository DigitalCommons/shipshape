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
    $datasetToParams = function($datasets, $dataset) use($url) {
        $params = [
            'endpoint' => trim(text("$url/configuration/$dataset/endpoint.txt", "")),
            'defaultGraphUri' => trim(text("$url/configuration/$dataset/default-graph-uri.txt", "")),
            'query' => trim(text("$url/configuration/$dataset/query.rq", "")),
            'meta' => ['?'],
            'meta_url' => '',
        ];

        if ($params['defaultGraphUri']) {
            // Ensure $defaultGraphUri ends with a slash before getting it
            $dgu = preg_replace('/\\/*\\s*$/', '/', $params['defaultGraphUri']);
            $index_url = get_redirected_url($dgu);
            $meta_url = preg_replace('/\\/[^\\/]*$/i', '/meta.json', $index_url);
            $params['meta_url'] = $meta_url;
            $params['meta'] = json($meta_url, []);
        }
        $datasets[$dataset] = $params;
        return $datasets;
    };

    $config = json("$url/configuration/config.json", []);
    $version = json("$url/configuration/version.json", []);

    $datasets = array_key_exists("namedDatasets", $config) && is_array($config["namedDatasets"])?
              array_reduce($config["namedDatasets"], $datasetToParams, []) : [];
    
    return ['url' => $url,
            'config' => $config,
            'datasets' => $datasets,
            'version' => $version];
}
            
$url = $_GET['url'];
header('Content-type: application/json');
try {
    if (!$url) throw new Exception("no url parameter");
    print json_encode(inspect_site($url));
} catch(Exception $e) {
    print json_encode(['error' => $e->getMessage()]);
}

