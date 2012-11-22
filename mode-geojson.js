var geoJSON, geoJSONLayer, geoJSONStyle;

function getGeoJSONUrl() {
    return $.owlviewer.owl_api_url + 'changesets/{z}/{x}/{y}.geojson?timelimit=' + getTimelimit();
}

function initGeoJSON() {
    // Add GeoJSON feature layer
    L.ExtendedGeoJSON = L.GeoJSON.extend({
        addData: function (geojson) {
            var add = true;
            this.eachLayer(function(layer) {
                if ((typeof layer.feature == 'undefined') && layer.feature.id == geojson.id) {
                  // Already added.
                  add = false;
                  return;
                }
            });
            if (add && (typeof geojson != 'undefined')) {
                L.GeoJSON.prototype.addData.apply(this, arguments);
            }
        }
    });

    geoJSONStyle = {
        "color": "yellow",
        "fillColor": "yellow",
        "weight": 10,
        "opacity": 0.75,
        "fillOpacity": 0.75
    };
    geoJSONLayer = new L.ExtendedGeoJSON(null, {
        pointToLayer: function(featureData, latlng) {
            return new L.Circle(latlng, 2);
        },
        onEachFeature: function (feature, layer) {
            layer.setStyle(geoJSONStyle);
            layer.on('mouseover', function() {
                layer.setStyle({
                    "color": "blue",
                    "opacity": 0.05,
                    "fillOpacity": 0.05
                });
                highlightChangeset(feature.properties.id);
            });
            layer.on('mouseout', function() {
                layer.setStyle(geoJSONStyle);
                unhighlightChangeset(feature.properties.id);
            });
        }
    });
    map.addLayer(geoJSONLayer);

    // Add loader for tiled GeoJSON
    geoJSON = new L.TileLayer.GeoJSON(getGeoJSONUrl());
    geoJSON.on('loading', function(e) {
        $('#changesets').html("<div class='loader'><img src='img/spinner.gif' /></div>");
    });
    geoJSON.on('load', function(e) {
        // Add data to geoJSON layer and populate changeset list
        var data = geoJSON.data();
        geoJSONLayer.addData(data);
        setChangesetsFromGeoJSON();
    });
}

function enableMode_GeoJSON() {
    markers.setUrl(getGeoJSONUrl(), true);
    !map.hasLayer(geoJSONLayer) && map.addLayer(geoJSONLayer);
    !map.hasLayer(geoJSON) && map.addLayer(geoJSON);
}

function disableMode_GeoJSON() {
    map.removeLayer(geoJSON);
    map.removeLayer(geoJSONLayer);
}

// Extracts changesets from the GeoJSON layer.
function setChangesetsFromGeoJSON() {
    var geojson = geoJSON.data();
    changesets = [];
    for (k in geojson) {
        if (geojson[k]) {
            for (j in geojson[k].features) {
                addChangeset(geojson[k].features[j].properties);
            }
        }
    }
    updateChangesetList();
}
