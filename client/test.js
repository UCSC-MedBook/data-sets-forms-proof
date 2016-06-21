Template.body.onCreated(function() {
  let instance = this;

  instance.crfsSub = Meteor.subscribe("crfs");
  instance.genomicsSub = Meteor.subscribe("genomic");
  instance.genomicsMetadataSub = Meteor.subscribe("genomicsMetadata");

  console.log("subscribed");
  instance.start = new Date();
});

Template.body.onRendered(function() {
  let instance = this;

  // get something ready for when the data is loaded

  var margin = {top: 20, right: 20, bottom: 250, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
      .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left")
      .ticks(10);

  var svg = d3.select("#d3-attach").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // require data to be loaded, then process and draw with d3
  instance.autorun(() => {
    if (instance.crfsSub.ready() &&
        instance.genomicsSub.ready() &&
        instance.genomicsMetadataSub.ready()) {
      instance.subEnd = new Date();
      console.log("done loading, drawing...");

      let allCRFs = CRFs.find().fetch();
      let dataSet = DataSets.findOne();
      let geneExp = GeneExpression.findOne();

      let expValuesByCohort = {};
      _.each(allCRFs, (crf) => {
        let { cohort } = crf;

        if (!expValuesByCohort[cohort]) expValuesByCohort[cohort] = [];

        let expIndex = dataSet.gene_expression_index[crf.Sample_ID];
        let value = geneExp.rsem_quan_log2[expIndex];
        if (!isNaN(value)) {
          expValuesByCohort[cohort].push(value);
        }
      });

      let data = _.chain(expValuesByCohort)
          .map((values, cohort) => {
            let sum = _.reduce(values, (memo, num) => {
              return memo + num;
            }, 0);

            return {
              cohort,
              count: values.length,
              average: sum / values.length,
            };
          })
          .filter((d) => { return d.count > 0 && d.cohort; })
          .value();
      console.log("data:", data);

      x.domain(data.map(function(d) { return d.cohort; }));
      y.domain([0, d3.max(data, function(d) { return d.average; })]);

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)
        .selectAll("text")
          .attr("y", 0)
          .attr("x", 9)
          .attr("dy", ".35em")
          .attr("transform", "rotate(90)")
          .style("text-anchor", "start");

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("Average");

      svg.selectAll(".bar")
          .data(data)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", function(d) { return x(d.cohort); })
          .attr("width", x.rangeBand())
          .attr("y", function(d) { return y(d.average); })
          .attr("height", function(d) { return height - y(d.average); });

      console.log("done drawing");
      console.log("CRFs.find().count():", CRFs.find().count());

      let now = new Date();
      console.log("loading time:", instance.subEnd - instance.start);
      console.log("processing/drawing time:", now - instance.subEnd);
      console.log("total time:", now - instance.start);
    }
  });
});
