var helper = require("node-red-node-test-helper");
var frenchHolidaysNode = require("../french-holidays/french-holidays.js");

var flow = [
  {
      "id": "n1",
      "type": "french-holidays",    
      "name": "Vacances",
      "academy": "Rennes",
      "geo": "Métropole",
      "wires": [
          [
              "n2"
          ]
      ]
  },
  {
      "id": "n2",
      "type": "helper",
      "name": "",
      "wires": []
  }
];

describe('french-holidays Node', function () {

  afterEach(function () {
    helper.unload();
  });

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "french-holidays", name: "test name" }];
    helper.load(frenchHolidaysNode, flow, function () {
      var n1 = helper.getNode("n1");
      n1.should.have.property('name', 'test name');
      done();
    });
  });

  it('should make payload contains current day data', function (done) {
    
    helper.load(frenchHolidaysNode, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          today = new Date();

          msg.payload.should.have.property('day', today.getDay());
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: "test" });
    });
  }); 

  it('should make payload contains schoolHolidaysName data', function (done) {
    
    helper.load(frenchHolidaysNode, flow, function () {
      var n2 = helper.getNode("n2");
      var n1 = helper.getNode("n1");
      n2.on("input", function (msg) {
        try {
          today = new Date();

          msg.payload.should.have.property('schoolHolidaysName');
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: "test" });
    });
  });


it('should make payload contains year data', function (done) {
    
  helper.load(frenchHolidaysNode, flow, function () {
    var n2 = helper.getNode("n2");
    var n1 = helper.getNode("n1");
    n2.on("input", function (msg) {
      try {
        today = new Date();
        msg.payload.should.have.property('year', today.getFullYear());
        done();
      } catch(err) {
        done(err);
      }
    });
    n1.receive({ payload: "test" });
  });
}); 
});