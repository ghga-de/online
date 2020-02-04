// Register the listener for all toggle fields in the table.
function mapOverHTMLElements(htmlCollectionOf, fun) {
    for (let eidx = 0; eidx < htmlCollectionOf.length; ++eidx) {
        fun(htmlCollectionOf[eidx])
    }
}

// The actual listener.
function descriptionToggleListener(ev) {
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

function retrieveData(url) {
  // For now ignore this is a synchronous remote request.
  let req = new XMLHttpRequest();
  req.open("GET", url, false);
  req.send(null);
  return JSON.parse(req.response);
}

function range(first, excluding) {
  let result = [];
  for(let i = first; i < excluding; ++i) {
    result.push(i);
  }
  return result;
}

function m_ega(type, id) {
  return m("a", {
      href: "https://ega-archive.org/" + type + "/" + id,
      target: "_blank"
  }, id);
}

function m_title(idx, study) {
  return idx == 0
    ? m("td", {
          rowspan: study.datasets.length,
          class: "StudyCell",
        }, study.title)
    : null;
}

function m_studyId(idx, study) {
  return idx == 0
    ? m("td", {
          rowspan: study.datasets.length,
          class: "StudyCell"
        }, m_ega("studies", study.egaStableId))
    : null;
}

function m_dataset(idx, study) {
  return m("td", {
      class: "StudyCell"
  }, m_ega("datasets", study.datasets[idx]))
}

function m_dac(idx, study, datasetDacMap) {
  let dsId = study.datasets[idx];
  let dacId = datasetDacMap[dsId];
  return m("td", {
     class: "StudyCell"
  }, m_ega("dac", dacId));
}

function m_toggle(idx, study) {
  return idx == 0
    ? m("td", {
          rowspan: study.datasets.length,
          // class: "StudyCell"
        }, m("a", {
                  class: "DescriptionToggle",
                  targetId: "description-" + study.egaStableId,
                  state: "closed"
              },
              m("i", {class: "fa fa-plus-square-o"})))
    : null;
}

function m_tableRowWithDescription(study, datasetDacMap) {
   return range(0, study.datasets.length).map((idx) => {
       return m("tr",  [
            m_toggle(idx, study),
            m_title(idx, study),
            m_studyId(idx, study),
            m_dataset(idx, study),
            m_dac(idx, study, datasetDacMap)
        ])
  }).concat([
       <!-- The initial state of the DescriptionToggle should be set to "closed" (because of display:none). -->
       m("tr", {
           id: "description-" + study.egaStableId,
           class: "StudyDescriptionRow",
           style: "display:none"
       }, [ m("td"), m("td", {
                colspan: 4,
                class: "StudyDescriptionCell"
            }, study.description)
       ])
  ]);
}

function studyTable(studies, datasets, dacs) {
  let datasetDacMap = {}
  datasets.forEach((ds, i) => {
    if (ds.dacs.length != 1)
      console.log("Not exactly one DAC for dataset " + ds.egaStableId + ": " + ds.dacs);
    datasetDacMap[ds.egaStableId] = ds.dacs[0];
  });
  return m("table", {class: "table", style: "table-layout:fixed", width: "100%"}, [
            m("caption", "As of January 28th, 2020, there are " + studies.size + " EGA studies referring to data access committees located in Tübingen and Heidelberg."),
                m("thead",
                    m("tr", [
                        m("th", { width: "3%"}, ""),
                        m("th", "Study Title"),
                        m("th", { width: "20%", align: "center"}, "Study ID"),
                        m("th", { width: "20%", align: "center"}, "Dataset"),
                        m("th", { width: "20%", align: "center"}, "DAC")
                    ])
                ),
                m("tbody",
                    studies.reduce((acc, study) => acc.concat(m_tableRowWithDescription(study, datasetDacMap)), [])
                )
        ]);
}
