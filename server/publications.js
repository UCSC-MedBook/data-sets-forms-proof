Meteor.publish("genomic", function() {
  return GeneExpression.find({
    data_set_id: "YDcb7YWfXTdjXbSKX",
    gene_label: "HOXB13",
  });
});

Meteor.publish("genomicsMetadata", function() {
  var handle = DataSets.find({ _id: "YDcb7YWfXTdjXbSKX" }, {
    fields: {
      gene_expression_index: 1,
      name: 1,
    },
  }).observeChanges({
    added: (id, doc) => {
      // rename all the samples with "-changed"
      let newIndex = {};

      _.each(doc.gene_expression_index, (value, index) => {
        newIndex[index + "-changed"] = value;
      });

      doc.gene_expression_index = newIndex;

      this.added("data_sets", id, doc);
    }
  });

  this.onStop(function () {
    handle.stop();
  });

  this.ready();
});

Meteor.publish("crfs", function() {
  var handle = CRFs.find({ Study_ID: "tcga" }, {
    fields: {
      Sample_ID: 1,
      cohort: 1,
    },
  }).observeChanges({
    added: (id, doc) => {
      doc.Sample_ID += "-changed";
      this.added("CRFs", id, doc);
    }
  });

  this.onStop(function () {
    handle.stop();
  });

  this.ready();
});
