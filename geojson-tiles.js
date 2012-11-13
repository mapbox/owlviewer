// Load tiled GeoJSON and merge into single geojson hash.
// Requires jQuery for jsonp.
L.TileLayer.GeoJSON = L.TileLayer.Data.extend({
    // Retrieve an array of GeoJSON features.
    data: function() {
        var geojson = [];
        for (k in this._tiles) {
            var data = this._tiles[k].data;
            if (data && data.features) {
                geojson = $.merge(geojson, data.features);
            }
        }
        return geojson;
    }
});
