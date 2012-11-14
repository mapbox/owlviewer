// Load tiled GeoJSON and merge into single geojson hash.
// Requires jQuery for jsonp.
L.TileLayer.GeoJSON = L.TileLayer.Data.extend({
    // Retrieve an array of GeoJSON features (only features from *visible* tiles are returned!).
    data: function() {
        var geojson = [];
        var bounds = this.getTileBounds();
        if (!bounds) { return geojson; }
        for (k in this._tiles) {
            var tile_x = k.split(':')[0], tile_y = k.split(':')[1];
            if (tile_x < bounds.min.x || tile_x > bounds.max.x || tile_y < bounds.min.y || tile_y > bounds.max.y) {
                // Tile is out of bounds (not visible) - skip it.
                continue;
            }
            var data = this._tiles[k].data;
            if (data && data.features) {
                geojson = $.merge(geojson, data.features);
            }
        }
        return geojson;
    },
    getTileBounds: function() {
        if (!this._map) { return; }
        var bounds = this._map.getPixelBounds(),
          zoom = this._map.getZoom(), tileSize = this.options.tileSize;
        var nwTilePoint = new L.Point(
          Math.floor(bounds.min.x / tileSize),
          Math.floor(bounds.min.y / tileSize)),
        seTilePoint = new L.Point(
          Math.floor(bounds.max.x / tileSize),
          Math.floor(bounds.max.y / tileSize));
        return new L.Bounds(nwTilePoint, seTilePoint);
    }
});
