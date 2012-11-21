var geoJSON, geoJSONLayer, geoJSONStyle;

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
            var id = '#changeset-' + feature.properties.id;
            layer.setStyle(geoJSONStyle);
            layer.on('mouseover', function() {
                layer.setStyle({
                    "color": "blue",
                    "opacity": 0.05,
                    "fillOpacity": 0.05
                });
                $(id).addClass('highlight');
            });
            layer.on('mouseout', function() {
                layer.setStyle(geoJSONStyle);
                $(id).removeClass('highlight');
            });
        }
    });
    map.addLayer(geoJSONLayer);

    // Add loader for tiled GeoJSON
    geoJSON = new L.TileLayer.GeoJSON($.owlviewer.owl_api_url + 'changesets/{z}/{x}/{y}.geojson');
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
