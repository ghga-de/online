#!/usr/bin/env bash
# Prepare data for the GHGA.de website prototype
# Based on code by Jules Kerssemakers.

set -uvex

getData() {
    local tag="$1"
    local selectionJq="$2"

    mkdir -p "$tag"
    cat ega-dacs.json \
	| jq -S '[ .response.result[] | select(.released=="RELEASED") | '"$selectionJq"' ]' \
	> "$tag/dacs.json"

    # For the next EGA request we need the DAC IDs.
    cat "$tag/dacs.json" \
	| grep egaStableId \
	| grep -Eo "EGAC[0-9]+" \
	> "$tag/dac-ids.tsv"

    # # For each DAC, get all the associated Datasets
    if [[ ! -d "$tag/datasets-per-dac" ]]; then
	mkdir "$tag/datasets-per-dac"
	for dacId in $(cat "$tag/dac-ids.tsv"); do
    	    curl "$endPoint/datasets?queryBy=dac&queryId=${dacId}&limit=0" -o "$tag/datasets-per-dac/${dacId}"
	done
    fi

    # ... and get them into a structure sorted by DAC.
    (for dacId in $(ls "$tag/datasets-per-dac/"); do
	cat "$tag/datasets-per-dac/${dacId}" | jq -S ".response.result | { \"$dacId\": . }"
	done) \
	    | jq -S --slurp 'reduce .[] as $item ({}; . + $item)' \
	    >  "$tag/datasets-per-dac.json"

    cat "$tag/datasets-per-dac.json" \
	| grep egaStableId \
	| grep -Eo "EGAD[0-9]+" \
	> "$tag/dataset-ids.tsv"
    # wc -l => 80 datasets

    # Finish the datasets JSON. This rescues the DAC IDs into the field datasets = [id1, id2, ...].
    cat "$tag/datasets-per-dac.json" \
	| jq -S 'to_entries | map (.key as $dacId | .value | map(.dacs = [ $dacId ])) | flatten | group_by(.egaStableId) | map(reduce .[] as $item (.[0]; .dacs = (.dacs + $item.dacs | unique | sort)))' \
	> "$tag/datasets.json"

    # Get studies to which the datasets belong
    if [[ ! -d "$tag/studies-per-dataset" ]]; then
	mkdir -p "$tag/studies-per-dataset"
	for datasetId in $(cat "$tag/dataset-ids.tsv"); do
    	    curl "$endPoint/studies?queryBy=dataset&queryId=${datasetId}&limit=0" -o "$tag/studies-per-dataset/${datasetId}"
	done
    fi

    (for datasetId in $(ls "$tag/studies-per-dataset/"); do
	cat "$tag/studies-per-dataset/$datasetId" | jq -S ".response.result | { \"$datasetId\": . }"
	done) \
	    | jq -S --slurp 'reduce .[] as $item ({}; . + $item)' \
	    > "$tag/studies-per-dataset.json"

    # Finish the studies JSON. This rescues the dataset IDs into the field datasets = [id1, id2, ...].
    cat "$tag/studies-per-dataset.json" \
	| jq -S 'to_entries | map (.key as $dsId | .value | map(.datasets = [ $dsId ])) | flatten | group_by(.egaStableId) | map(reduce .[] as $item (.[0]; .datasets = (.datasets + $item.datasets | unique | sort)))' \
	> "$tag/studies.json"

    cat "$tag/studies.json" \
	| grep egaStableId \
	| grep -Eo "EGAS[0-9]+" \
	> "$tag/study-ids.tsv"
    # wc -l: 41 studies

}


endPoint="https://ega-archive.org/metadata/v2"

if [[ ! -f ega-dacs.json ]]; then
    curl "$endPoint/dacs/?limit=0" \
	> ega-dacs.json
fi

germanSelectionJq='select(any( .contacts[].email; contains("heidelberg")) or any( .contacts[].email; contains("tuebingen")))'
getData german "$germanSelectionJq"
