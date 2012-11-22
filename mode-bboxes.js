var bboxTileLayer;
var bboxes = [];

function initBboxMode() {
    bboxTileLayer = new L.TileLayer.Data($.owlviewer.owl_api_url + 'changesets/{z}/{x}/{y}.json?limit=5');

    bboxTileLayer.on('tileload', function(e) {
        var t = e.tile;
        setChangesetsFromBboxes();
    });
    bboxTileLayer.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    bboxTileLayer.on('load', function(e) {
        //$('#zoominfo').html("<div class='info'>Zoom in to see<br>changeset details.</div>");
    });
}

function enableMode_Bboxes() {
    !map.hasLayer(bboxTileLayer) && map.addLayer(bboxTileLayer);
}

function disableMode_Bboxes() {
    map.removeLayer(bboxTileLayer);
}

// Extracts changesets from the summary tiles (marker) layer.
function setChangesetsFromBboxes() {
    for (k in bboxes) {
        map.removeLayer(bboxes[k]);
    }
    bboxes = [];
    var data = bboxTileLayer.data();
    changesets = [];
    for (k in data) {
        for (j in data[k]) {
            addChangeset(data[k][j]);
            if (data[k][j].tile_bbox) {
                var bounds = [[data[k][j].tile_bbox[1], data[k][j].tile_bbox[0]],
                    [data[k][j].tile_bbox[3], [data[k][j].tile_bbox[2]]]];
                var layer = L.rectangle(bounds, {color: "#ff7800", weight: 1, fillColor: 'red', fillOpacity: 0.25}).addTo(map);
                bboxes.push(layer);
            }
        }
    }
    updateChangesetList();
}
