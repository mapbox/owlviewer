var geoJSON, geoJSONLayer, geoJSONStyle;

function getGeoJSONUrl() {
    return $.owlviewer.owl_api_url + 'changesets/{z}/{x}/{y}.geojson?timelimit=' + getTimelimit();
}

function getChangesetIdFromFeatureId(feature_id) {
    return parseInt(feature_id.split("_")[0]);
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
                highlightChangeset(getChangesetIdFromFeatureId(feature.id));
            });
            layer.on('mouseout', function() {
                layer.setStyle(geoJSONStyle);
                unhighlightChangeset(getChangesetIdFromFeatureId(feature.id));
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
        $.each(data, function(i, tile_data) {
            $.each(tile_data.features, function(j, changeset) {
                geoJSONLayer.addData(changeset.features);
                addChangeset(changeset.properties);
            });
        });
        updateChangesetList();
    });
}

function enableMode_GeoJSON() {
    geoJSON.setUrl(getGeoJSONUrl(), true);
    !map.hasLayer(geoJSONLayer) && map.addLayer(geoJSONLayer);
    !map.hasLayer(geoJSON) && map.addLayer(geoJSON);
}

function disableMode_GeoJSON() {
    map.removeLayer(geoJSON);
    map.removeLayer(geoJSONLayer);
}

// Highlights all features for given changeset.
function highlightGeoJSON(changeset_id) {
    geoJSONLayer.eachLayer(function(layer) {
        if ((typeof layer.setStyle == 'undefined') || layer.feature.id.indexOf(changeset_id) != 0) {
            // Not what we're looking for.
            return;
        }
        layer.setStyle({
            "color": "blue",
            "opacity": 0.05,
            "fillOpacity": 0.05
        });
    });
}

// Unhighlights all features for given changeset.
function unhighlightGeoJSON(changeset_id) {
    geoJSONLayer.eachLayer(function(layer) {
        if ((typeof layer.setStyle == 'undefined') || layer.feature.id.indexOf(changeset_id) != 0) {
            // Not what we're looking for.
            return;
        }
        layer.setStyle(geoJSONStyle);
    });
}
