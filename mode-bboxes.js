var bboxTileLayer;
var bboxes = [];

function getBboxUrl() {
    return $.owlviewer.owl_api_url + 'changesets/{z}/{x}/{y}.json?limit=5&timelimit=' + getTimelimit();
}

function initBboxMode() {
    bboxTileLayer = new L.TileLayer.Data(getBboxUrl());

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
    bboxTileLayer.setUrl(getBboxUrl(), true);
    !map.hasLayer(bboxTileLayer) && map.addLayer(bboxTileLayer);
}

function disableMode_Bboxes() {
    map.removeLayer(bboxTileLayer);
    for (k in bboxes) {
        map.removeLayer(bboxes[k]);
    }
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
                var layer = L.rectangle(bounds, {
                    changeset_id: data[k][j].id,
                    color: 'black',
                    opacity: 1,
                    weight: 1,
                    fillColor: 'red',
                    fillOpacity: 0.25}).addTo(map);
                layer.on('mouseover', function (e) {
                    highlightChangeset(e.target.options.changeset_id);
                    for (i in bboxes) {
                        if (e.target.options.changeset_id == bboxes[i].options.changeset_id) {
                            bboxes[i].setStyle({
                                fillColor: 'blue',
                                fillOpacity: 0.25
                            });
                        }
                    }
                });
                layer.on('mouseout', function (e) {
                    unhighlightChangeset(e.target.options.changeset_id);
                    for (i in bboxes) {
                        if (e.target.options.changeset_id == bboxes[i].options.changeset_id) {
                            bboxes[i].setStyle({
                                color: 'black',
                                opacity: 1,
                                weight: 1,
                                fillColor: 'red',
                                fillOpacity: 0.25
                            });
                        }
                    }
                });
                bboxes.push(layer);
            }
        }
    }
    updateChangesetList();
}
