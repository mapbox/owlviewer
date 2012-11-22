var markers, markersLayer;

function initSummary() {
    // Add summary tiles.
    markersLayer = L.layerGroup();
    map.addLayer(markersLayer);

    markers = new L.TileLayer.Marker($.owlviewer.owl_api_url + 'summary/{z}/{x}/{y}');

    map.on('viewreset', function (e) {
        markersLayer.clearLayers();
    });

    markers.on('tileload', function(e) {
        var t = e.tile;
        var icon = L.divIcon({
            html: templates.summarytile(t.data),
            className: 'summary-tile',
            iconSize: [256, 256]
        });
        markersLayer.addLayer(L.marker(t.location, {icon: icon}));
        setChangesetsFromSummaryTiles();
    });
    markers.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    markers.on('load', function(e) {
        //$('#zoominfo').html("<div class='info'>Zoom in to see<br>changeset details.</div>");
    });
}

function enableMode_Summary() {
    !map.hasLayer(markersLayer) && map.addLayer(markersLayer);
    !map.hasLayer(markers) && map.addLayer(markers);
}

function disableMode_Summary() {
    map.removeLayer(markers);
    map.removeLayer(markersLayer);
}

// Extracts changesets from the summary tiles (marker) layer.
function setChangesetsFromSummaryTiles() {
    var data = markers.data();
    changesets = [];
    for (k in data) {
        if (data[k]) {
            addChangeset(data[k].latest_changeset);
        }
    }
    updateChangesetList();
}
