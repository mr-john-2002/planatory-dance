// SVG paramters
var width = 700;
var height = 700;
var padding = 20;
var svg = d3.select("#anim")
    .attr("width", width)
    .attr("height", height);

// Drawing parameters and utilities
var pi = Math.PI;
var sin = Math.sin;
var cos = Math.cos;

// Motion determination and drawing parameters
var speed = 0.00007;
var t; // The global variable t will be set inside draw as:
// t = (Date.now()-start_time-elapsed)*speed;
// We might think of it as a global time variable that can be
// stopped and started by the controls.
var start_time = Date.now();
var stop_time;
var last = 0; // Remember how long it's been since we drew a line segment
var elapsed = 0; // Remember how long it's been since the motion paused

var num_complete_revolutions = 1; // How many complete (paired) revolutions we want.
// Incremented when running is set to true after a paired revolution has been completed.

// Initialize a few things
var venus_speed_fraction = math.fraction('13/8');
var venus_speed = math.number(venus_speed_fraction);
var denominator = venus_speed_fraction.d;
var opacity = 0.2;
var running = true;

// Define functions to map from the screen to container coordinates
var bb = 1.2
var xmin = -bb;
var xmax = bb;
var ymin = -bb;
var ymax = bb;
var xScale = d3.scale.linear()
    .domain([xmin, xmax])
    .range([padding, width - padding]);
var yScale = d3.scale.linear()
    .domain([ymin, ymax])
    .range([height - padding, padding]);
var rScale = d3.scale.linear()
    .domain([0, xmax - xmin])
    .range([0, width - 2 * padding]);
var pts_to_path = d3.svg.line()
    .x(function(d) { return xScale(d[0]); })
    .y(function(d) { return yScale(d[1]); })
    .interpolate("linear");


// Draw the earth_orbit and the initial venus orbit.
var earth_orbit = svg.append("circle")
    .attr("cx", xScale(0))
    .attr("cy", yScale(0))
    .attr("r", rScale(1))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1);
var venus_radius = 0.7;
var venus_orbit = svg.append("circle")
    .attr("id", "venus_orbit")
    .attr("cx", xScale(0))
    .attr("cy", yScale(0))
    .attr("r", rScale(venus_radius))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1);


// The main functions.
function sun_position(t) {
    return [sin(0), sin(0)]
}

function earth_position(t) {
    return [cos(2 * pi * t), sin(2 * pi * t)]
}

function venus_position(t) {
    return [
        venus_radius * cos(2 * pi * t * venus_speed),
        venus_radius * sin(2 * pi * t * venus_speed)
    ]
}

function draw() {
    if (running) {
        svg.selectAll(".planet").remove();
        t = (Date.now() - start_time - elapsed) * speed;
        var vp = venus_position(t);
        var vx = vp[0];
        var vy = vp[1]
        var ep = earth_position(t);
        var ex = ep[0];
        var ey = ep[1];
        var sx = 0
        var sy = 0

        if (t > denominator * num_complete_revolutions) {
            num_complete_revolutions = num_complete_revolutions + 1;
            running = false;
            stop_time = Date.now();
            // elapsed = elapsed + Date.now() - stop_time;
            $("#startstop-checkbox").prop('checked', false);

        }

        if (t - last > 0.003) {
            last = t;
            svg.append("path")
                .attr("class", "envelope")
                .attr("d", pts_to_path([vp, ep]))
                .attr("stroke", "black")
                .attr("stroke-opacity", opacity)
                .attr("stroke-width", 1);
        }
        var sun = svg.append("circle")
            .attr("class", "planet")
            .attr("id", "sun")
            .attr("cx", xScale(sx))
            .attr("cy", yScale(sy))
            .attr("r", rScale(.09))
            .attr("fill", "orange")
            .attr("stroke", "orange")
            .attr("stroke-width", 2);

        var venus = svg.append("circle")
            .attr("class", "planet")
            .attr("id", "venus")
            .attr("cx", xScale(vx))
            .attr("cy", yScale(vy))
            .attr("r", rScale(.02))
            .attr("fill", "red")
            .attr("stroke", "black")
            .attr("stroke-width", 1);
        var earth = svg.append("circle")
            .attr("class", "planet")
            .attr("id", "earth")
            .attr("cx", xScale(ex))
            .attr("cy", yScale(ey))
            .attr("r", rScale(.02))
            .attr("fill", "blue")
            .attr("stroke", "black")
            .attr("stroke-width", 1);
    }
    return !running;
}


// Set up the controls
// The "running or not running checkbox
$("#startstop-checkbox").prop('checked', running);
$("#startstop-checkbox").on("click",
    function() {
        running = $("#startstop-checkbox").is(":checked");
        if (running) {
            elapsed = elapsed + Date.now() - stop_time;
            d3.timer(draw);
        } else {
            stop_time = Date.now();
        }
    }
);


// The inner radius slider
$("#radius")
    .attr("min", 0.5)
    .attr("max", 0.8)
    .attr("step", 0.01)
    .val(0.7)
    .on("mousedown", function() {
        svg.selectAll(".envelope")
            .attr("stroke-opacity", 0.2).transition().duration(250).attr("stroke-opacity", 0);
        svg.selectAll(".planet")
            .style("opacity", 1).transition().duration(250).style("opacity", 0);
        setTimeout(function() {
            svg.selectAll(".envelope").remove();
            svg.selectAll(".planet").remove()
        }, 250);
        num_complete_revolutions = 1;
        if (running) {
            running = false;
            stop_time = 0; // Date.now();
        }
    })
    .on("mouseup", function() {
        start_time = Date.now();
        last = 0;
        stop_time = 0;
        $("#startstop-checkbox").prop('checked', true);
        venus_radius = $("#radius").val();
        running = true;
        elapsed = 0; // elapsed + Date.now() - stop_time;
        d3.timer(draw);
    })
    .on("input", function() {
        svg.select("#venus_orbit")
            .attr("r", rScale($("#radius").val()))
    });

// The relative speed input box
$("#relative_speed")
    .attr("min", 0)
    .attr("max", 10)
    .attr("step", 0.01)
    .val('13/8')
    .keydown(function(e) {
        if (e.keyCode == 13) {

            try {
                running = false;
                venus_speed = math.eval($("#relative_speed").val());
                venus_speed_fraction = math.fraction(venus_speed);
                denominator = venus_speed_fraction.d;
            } catch (e) {
                if (e.toString().substring(0, 23) == "Error: Undefined symbol") {
                    alert('cannot parse input as a number');
                }
            }

            svg.selectAll(".envelope")
                .attr("stroke-opacity", 0.2).transition().duration(250).attr("stroke-opacity", 0);
            svg.selectAll(".planet")
                .style("opacity", 1).transition().duration(250).style("opacity", 0);
            setTimeout(function() {
                svg.selectAll(".envelope").remove();
                svg.selectAll(".planet").remove();
                running = true;
                start_time = Date.now();
                last = 0;
                stop_time = 0;
                num_complete_revolutions = 1;
                $("#startstop-checkbox").prop('checked', true);

                elapsed = 0; // elapsed + Date.now() - stop_time;
                d3.timer(draw);
            }, 250);
        }
    });


// Start the action!!
d3.timer(draw);
