var markers, markersLayer;

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

    markers.on('tileload', function(e) {
        setChangesetsFromSummaryTiles();
    });
    markers.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    markers.on('load', function(e) {
        markersLayer.clearLayers();

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
            var size = parseInt((256 - 96) * (tile.data.num_changesets - minCount) / (maxCount - minCount) + 96);
            var icon = L.divIcon({
                html: templates.summarytile({tiledata: tile.data, size: size, divclass: cl}),
                className: 'summary-tile',
                iconSize: [size, size]
            });
            markersLayer.addLayer(L.marker(tile.location, {icon: icon}));
        });
    });
}

function enableMode_Summary() {
    markers.setUrl(getSummaryUrl(), true);
    !map.hasLayer(markersLayer) && map.addLayer(markersLayer);
    !map.hasLayer(markers) && map.addLayer(markers);
}

function disableMode_Summary() {
    map.removeLayer(markers);
    map.removeLayer(markersLayer);
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
