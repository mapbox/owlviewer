// Load tiled GeoJSON and merge into single geojson hash.
// Requires jQuery for jsonp.
L.TileLayer.GeoJSON = L.TileLayer.Data.extend({
    _data: [],
    // Retrieve data.
    data: function() {
        var geojson = {"type":"FeatureCollection","features":[]};
        for (k in this._tiles) {
            var data = this._tiles[k].data;
            if (data && data.features) {
                geojson.features =
                    geojson.features.concat(data.features);
            }
        }
        return geojson;
    }
});
