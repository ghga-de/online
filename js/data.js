
let support = {

    // Register the listener for all toggle fields in the table.
    mapOverHTMLElements: (htmlCollectionOf, fun) => {
        for (let eidx = 0; eidx < htmlCollectionOf.length; ++eidx) {
            fun(htmlCollectionOf[eidx])
        }
    },

    retrieveData: (url) => {
        // For now ignore this is a synchronous remote request.
        let req = new XMLHttpRequest();
        req.open("GET", url, false);
        req.send(null);
        return JSON.parse(req.response);
    },

    range: (first, excluding) => {
        let result = [];
        for(let i = first; i < excluding; ++i) {
            result.push(i);
        }
        return result;
    },

    m_ega: (type, id) => {
        return m("a", {
            href: "https://ega-archive.org/" + type + "/" + id,
            target: "_blank",
            title: id
        }, id);
    }

};

class StudyTable {

    constructor(dacs, studies, datasets) {
      this.dacs = dacs;
      this.studies = studies;
      this.datasets = datasets;

      this.selectedCheckboxes = {};
    }


    getSelectedDatasetIds() {
        let checkboxIds = [];
        Object.keys(this.selectedCheckboxes).forEach((key) => {
            if (this.selectedCheckboxes[key] === true)
                checkboxIds.push(key);
        });
        return checkboxIds.map((id) => {
            return id.split("-")[1];
        });
    }


    /* Take an array of objects with egaStableId field and return a dictionary with each element
       as value and its egaStableId as key. */
    static byEgaStableId(data) {
        let result = {};
        data.forEach((d) => {
            if (result[d.egaStableId] !== undefined)
                console.error("Data '" + d.egaStableId + "' is not unique! Overwriting!");
            result[d.egaStableId] = d;
        });
        return result;
    }

    /* Return a list of DACs, with a datasets field containing the full dataset information. */
    getSelectedDatasetsByDacs() {
        let datasetsById = StudyTable.byEgaStableId(this.datasets);
        // We make a clone because the structure will be returned.
        let dacsById = _.cloneDeep(StudyTable.byEgaStableId(this.dacs));

        function addDataset(dac, dataset) {
            if (dac.datasets === undefined)
                dac.datasets = [];
            dac.datasets.push(dataset);
            return dac;
        }

        this.getSelectedDatasetIds().forEach((selectedDsId) => {
            let selectedDataset = datasetsById[selectedDsId];
            if (selectedDataset.dacs.length !== 1)
                console.error("Dataset '" + selectedDsId + "' has not exactly one DAC. Using first one!");
            let dacId = selectedDataset.dacs[0];

            addDataset(dacsById[dacId], selectedDataset);
        });

        return _.filter((dac) => dac.datasets !== undefined)(dacsById);
    }


    toggleVisibility(id, displayValue) {
        var e = document.getElementById(id);
        if (e.style.display != 'none') {
            e.style.display = 'none'
        } else {
            e.style.display = displayValue;
        }
    }

    // The actual listener.
    descriptionToggleListener(ev) {
        const clickTarget = ev.currentTarget;
        if (clickTarget.state === "closed") {
            clickTarget.state = "opened";
            clickTarget.innerHTML = "<i class=\"fa fa-plus-square-o\"></i>"
        } else {
            clickTarget.state = "closed";
            clickTarget.innerHTML = "<i class=\"fa fa-minus-square-o\"></i>"
        }
        toggleVisibility(clickTarget.getAttribute("targetId"), 'table-row');
    }

    m_title(idx, study) {
        return idx === 0
            ? m("td", {
                rowspan: study.datasets.length
            }, study.title)
            : null;
    }

    m_studyId(idx, study) {
        return idx === 0
            ? m("td", {
                rowspan: study.datasets.length,
                class: "IdentifierCell"
            }, m("div", {class: "EllipsisText"}, support.m_ega("studies", study.egaStableId)))
            : null;
    }

    // Make a new event listener action that closes over the elementId context.
    updateDatasetSelectionAction(elementId) {
        return () => {
          if (undefined === this.selectedCheckboxes[elementId] ||
                  false === this.selectedCheckboxes[elementId]) {
              this.selectedCheckboxes[elementId] = true
          } else {
              this.selectedCheckboxes[elementId] = false
          }
      }
    }

    m_dataset(idx, study) {
        let dsId = study.datasets[idx];
        let elementId = "checkbox-" + dsId;
        return m("td", {
            class: "IdentifierCell"
        }, m("div", {class: "DatasetCheckboxDiv"}, [
            m("input", {
                type: "checkbox",
                class: "DatasetCheckbox",
                id: elementId,
                onclick: this.updateDatasetSelectionAction(elementId)
            }),
            " ",
            m("label", {class: "EllipsisText", for: "checkbox-" + dsId},
                support.m_ega("datasets", dsId)
            )
        ]));
    }

    m_dac(idx, study, datasetDacMap) {
        let dsId = study.datasets[idx];
        let dacId = datasetDacMap[dsId];
        return m("td", {
            class: "IdentifierCell"
        }, m("div", {class: "EllipsisText"}, support.m_ega("dacs", dacId)));
    }

    m_toggle(idx, study) {
        return idx === 0
            ? m("td", {
                rowspan: study.datasets.length,
            }, m("a", {
                    class: "DescriptionToggle",
                    targetId: "description-" + study.egaStableId,
                    state: "closed",
                    onclick: this.descriptionToggleListener
                },
                m("i", {class: "fa fa-plus-square-o"})))
            : null;
    }

    m_tableRowWithDescription(study, datasetDacMap) {
        return support.range(0, study.datasets.length).map((idx) => {
            return m("tr", [
                this.m_toggle(idx, study),
                this.m_title(idx, study),
                this.m_studyId(idx, study),
                this.m_dataset(idx, study),
                this.m_dac(idx, study, datasetDacMap)
            ])
        }).concat([
            <!-- The initial state of the DescriptionToggle should be set to "closed" (because of display:none). -->
            m("tr", {
                id: "description-" + study.egaStableId,
                class: "StudyDescriptionRow",
                style: "display:none"
            }, [m("td"), m("td", {
                colspan: 4,
                class: "StudyDescriptionCell"
            }, study.description)
            ])
        ]);
    }

    m_studyTable() {
        let datasetDacMap = {};
        this.datasets.forEach((ds, i) => {
            if (ds.dacs.length !== 1)
                console.warn("Not exactly one DAC for dataset " + ds.egaStableId + ": " + ds.dacs);
            datasetDacMap[ds.egaStableId] = ds.dacs[0];
        });

        return m("table", {class: "table", style: "table-layout:fixed", width: "100%"}, [
            m("caption", "As of January 28th, 2020, there are " + this.studies.size +
                         " EGA studies referring to data access committees located in Tübingen and Heidelberg."),
            m("thead",
                m("tr", [
                    m("th", {width: "3%"}, ""),
                    m("th", "Study Title"),
                    m("th", {width: "22%", style: "text-align:right"}, "Study ID"),
                    m("th", {width: "22%", style: "text-align:right"}, "Dataset"),
                    m("th", {width: "22%", style: "text-align:right"}, "DAC")
                ])
            ),
            m("tbody",
                this.studies.reduce((acc, study) => acc.concat(this.m_tableRowWithDescription(study, datasetDacMap)), [])
            )
        ]);
    }

};


class DacTable {

    constructor(studyTable) {
      this.studyTable = studyTable;
    }

    m_contact(contact) {
      return m("div", [
        contact.contactName,
        ", ",
        contact.organisation,
        " ",
        "(", contact.email, ")"
      ]);
    }

    m_dacInfo(dac) {
      let mainContact;
      if (dac.contacts.length === 0) {
        console.error("No contact found for DAC '" + dac.egaStableId + "'");
        mainContact = {
          contactName: "unknown",
          organisation: "unknown",
          email: "unknown"
        };
      } else {
        mainContact = _.filter((contact) => contact.mainContact === true)(dac.contacts);
        if (mainContact === undefined) {
          console.warning("No main-contact found for DAC '" + dac.egaStableId + "'")
          mainContact = dac.contacts[0];
        }
      }
      console.log(mainContact);
      return m("div", [
        m("div", [
          dac.title,
          " ",
          "(", support.m_ega("dacs", dac.egaStableId), ")"
        ]),
        m("div", this.m_contact(mainContact))
      ]);
    }

    m_datasets(datasets) {
      return datasets.map((ds) => m("div", {
        class: "EllipsisText"
      }, support.m_ega("datasets", ds.egaStableId)));
    }

    m_dacTable(data) {
        let dacsNdata = this.studyTable.getSelectedDatasetsByDacs();
        return m("table", {class: "table", style: "table-layout:fixed", width: "100%"}, [
            m("thead", m("tr", [
              m("th", { width: "75%"}, "Data Access Committee"),
              m("th", { width: "25%", style: "text-align:right"}, "Datasets")
            ])),
            m("tbody", dacsNdata.map((dac) => {
              return m("tr", [
                m("td", this.m_dacInfo(dac)),
                m("td", { class: "IdentifierCell" }, this.m_datasets(dac.datasets))
              ]);
            }))]);
    }

};
