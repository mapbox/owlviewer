var inspectedChangesetId;
var inspectedChangesetBounds;
var inspectedChangesetRectangle;

function initChangesetMode() {
}

function enableMode_Changeset() {
    var changeset = getChangeset(inspectedChangesetId);
    if (!changeset) { return; }
    activateChangeset(inspectedChangesetId);
    updateStatusbar(templates.statusbar_changeset(changeset));
    inspectedChangesetBounds = [[changeset.bbox[1], changeset.bbox[0]], [changeset.bbox[3], changeset.bbox[2]]];
    map.fitBounds(inspectedChangesetBounds);
    inspectedChangesetRectangle = L.rectangle(inspectedChangesetBounds, {
          color: 'black',
          opacity: 1,
          weight: 1,
          fillColor: 'blue',
          fillOpacity: 0.25}).addTo(map);
}

function disableMode_Changeset() {
    deactivateChangeset(inspectedChangesetId);
    inspectedChangesetRectangle && map.hasLayer(inspectedChangesetRectangle) && map.removeLayer(inspectedChangesetRectangle);
}

function getChangeset(id) {
    for (k in changesets) {
        if (changesets[k].id == id) {
            return changesets[k];
        }
    }
}
