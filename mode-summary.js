var markers, markersLayer;

var SUMMARY_MIN_SIZE = 64;
var SUMMARY_MAX_SIZE = 256;

function getSummaryUrl() {
    return $.owlviewer.owl_api_url + 'summary/{z}/{x}/{y}?timelimit=' + getTimelimit();
}

function getClassNameForSummaryTile(tiledata, min, max) {
    if (tiledata.num_changesets > min + 0.66 * (max - min)) {
        return 'summary-tile-large';
    } else if (tiledata.num_changesets > min + 0.33 * (max - min)) {
        return 'summary-tile-medium';
    } else {
        return 'summary-tile-small';
    }
}

function initSummary() {
    // Add summary tiles.
    markersLayer = L.layerGroup();
    map.addLayer(markersLayer);

    markers = new L.TileLayer.Marker(getSummaryUrl());

    map.on('viewreset', function (e) {
        markersLayer.clearLayers();
    });

    markers.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    markers.on('tileload', function(e) {
        markersLayer.clearLayers();
        setChangesetsFromSummaryTiles();

        // First, find out min and max changeset counts in current viewport - useful to show relative sizes.
        var minCount = null, maxCount = 0;
        _(markers.data()).each(function (tile) {
            if (tile.num_changesets > maxCount) {
                maxCount = tile.num_changesets;
            }
            if (minCount == null || tile.num_changesets < minCount) {
              minCount = tile.num_changesets;
            }
        });

        // Now add markers with proper sizes..
        _(markers.tiles()).each(function (tile) {
            var cl = getClassNameForSummaryTile(tile.data, minCount, maxCount);
            var size = parseInt((SUMMARY_MAX_SIZE - SUMMARY_MIN_SIZE) * (tile.data.num_changesets - minCount) /
                (maxCount - minCount) + SUMMARY_MIN_SIZE);
            var icon = L.divIcon({
                html: templates.summarytile({tiledata: tile.data, size: size, divclass: cl}),
                className: 'summary-tile',
                iconSize: [size, size]
            });
            var marker = L.marker(tile.location, {icon: icon});
            markersLayer.addLayer(marker);
            marker.on('click', function (e) {
                map.setView(tile.location, map.getZoom() + 1);
            });
        });
    });
}

function enableMode_Summary() {
    markers.setUrl(getSummaryUrl(), true);
    !map.hasLayer(markersLayer) && map.addLayer(markersLayer);
    !map.hasLayer(markers) && map.addLayer(markers);
}

function disableMode_Summary() {
    map.hasLayer(markers) && map.removeLayer(markers);
    map.hasLayer(markersLayer) && map.removeLayer(markersLayer);
    markersLayer.clearLayers();
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
