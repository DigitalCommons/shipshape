<?php // -*- php -*-

/** sea-map
 *
 * Gets the config/version and other data about a sea-map website,
 * given the URL as the `url` parameter.
 *
 */

$paths = [
    "coopsuk@dev-0" => "/var/www/vhosts/coopsuk.solidarityeconomy.coop/www",
    "dotcoop-project@dev-0" => "/var/www/vhosts/dotcoop.solidarityeconomy.coop/www",
    "ica-project@dev-0" => "/var/www/vhosts/ica.solidarityeconomy.coop/www",
    "mutual-aid-project@dev-0" => "/var/www/vhosts/mutual-aid.solidarityeconomy.coop/www",
    "newbridge-project@dev-0" => "/var/www/vhosts/newbridge.solidarityeconomy.coop/www",
    "oxford-project@dev-0" => "/var/www/vhosts/oxford.solidarityeconomy.coop/www",

    "coopsuk@prod-0" => "/var/www/vhosts/coopsuk.solidarityeconomy.coop/www",
    "dotcoop-project@prod-0" => "/var/www/vhosts/dotcoop.solidarityeconomy.coop/www",
    "ica-project@prod-0" => "/var/www/vhosts/ica.solidarityeconomy.coop/www",
    "mutual-aid-project@prod-0" => "/var/www/vhosts/mutual-aid.solidarityeconomy.coop/www",
    "newbridge-project@prod-0" => "/var/www/vhosts/newbridge.solidarityeconomy.coop/www",
    "oxford-project@prod-0" => "/var/www/vhosts/oxford.solidarityeconomy.coop/www",
    
    "coopsuk@sea-0" => "/var/www/sea-maps/coopsuk-map",
    "dotcoop-project@sea-0" => "/var/www/sea-maps/dotcoop-map",
    "newbridge-project@sea-0" => "/var/www/sea-maps/newcastle-map",
    "oxford-project@sea-0" => "/var/www/sea-maps/oxford-map",
];

$deployed = [
    "dev-0" => [
        "coopsuk" => "https://dev.coopsuk.solidarityeconomy.coop",
        "dotcoop-project" => "https://dev.dotcoop.solidarityeconomy.coop",
        "ica-project" => "https://dev.ica.solidarityeconomy.coop",
        "mutual-aid-project" => "https://dev.mutual-aid.solidarityeconomy.coop",
        "newbridge-project" => "https://dev.newbridge.solidarityeconomy.coop",
        "oxford-project" => "https://dev.oxford.solidarityeconomy.coop",
    ],
    
    "prod-0" => [
        "coopsuk" => "https://prod.coopsuk.solidarityeconomy.coop",
        "dotcoop-project" => "https://prod.dotcoop.solidarityeconomy.coop",
        "ica-project" => "https://prod.ica.solidarityeconomy.coop",
        "mutual-aid-project" => "https://prod.mutual-aid.solidarityeconomy.coop",
        "newbridge-project" => "https://prod.newbridge.solidarityeconomy.coop",
        "oxford-project" => "https://prod.oxford.solidarityeconomy.coop",
    ],
    "sea-0" => [
        //        "coopsuk" => "https://coopsuk.solidarityeconomy.coop",
        "dotcoop-project" => "https://dotcoop.solidarityeconomy.coop",
        //"newbridge-project" => "https://newbridge.solidarityeconomy.coop",
        //"oxford-project" => "https://oxford.solidarityeconomy.coop",
    ],
];


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
        //$meta = json("$dgu/meta.json");
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

