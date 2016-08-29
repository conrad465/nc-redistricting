import { Component } from '@angular/core';
import {
  AngularFire,
  AngularFireAuth,
  FirebaseListObservable,
  FirebaseObjectObservable
} from 'angularfire2';
import * as d3 from 'd3';
import * as topojson from 'topojson';

@Component({
  selector: 'app-root',
  // TODO the styles defined in the component aren't taking, I just stuck a copy
  // in index.css for the moment.
  styleUrls: [ 'app/design.component.css' ],
	templateUrl: 'app/design.component.html'
})

export class DesignComponent {
  user: FirebaseListObservable<any>;
  designs: FirebaseListObservable<any>;
  uid: string;

  error: string;

  constructor(af: AngularFire) {
    af.auth.subscribe(auth => {
      if (!auth) return;

      this.uid = auth.uid;
      this.user = af.database.list('/user-data/'+ auth.uid +'/designs');
      this.designs = af.database.list('/designs');
    });
  }

  ngOnInit() {
    // TODO get width, monitor screen width changes
    const width = document.getElementById('design-map').offsetWidth;
    const height = 400;
    let svg = d3.select('#design-map')
      .append('svg')
      .attr('width',width)
      .attr('height',height);

    // TODO scale depends on window width
    let projection = d3.geo.albers()
      .scale(7500)
      .center([0,0])
      .rotate([79.9,-35.2,-1])
      .translate([width / 2, height / 2]);

    let path = d3.geo.path()
      .projection(projection);

    svg.append('rect')
      .attr('class','map-background')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height);

    d3.json("/boundaries.topojson", (err, nc) => {
      if (err) { return console.log(err); }

      let boundaries = topojson.feature(nc, nc.objects.nc);

      svg.append('g')
          .attr('class','counties')
        .selectAll('path')
          .data(boundaries.features)
        .enter().append('path')
          .attr('class', 'county')
          .attr('d', path)
          .on('click', () => {
            console.log("|click");
          });

      // TODO Add a click listener - when a click is detected, make a point on
      // the map, and generate a voronoi diagram for it.
    })
  }

  save(name: string, notes:string) {
    let new_key = this.designs.push({
      uid: this.uid,
      name,
      notes
    });

    new_key.then(id => {
        let pushed = {};
        pushed[new_key.key] = true;
        this.user.push(pushed)
          .then(_ => console.log("Added new design to user profile"))
          .catch(err => this.error = err);
      })
      .catch(err => this.error = err);

    return false;
  }
}
