var Color = net.brehaut.Color

//var HEIGHT = 5;
//var WIDTH = 7;

//var HEIGHT = 12;
//var WIDTH = 15;

var HEIGHT = 12;
var WIDTH = 30;

//var HEIGHT = 20;
//var WIDTH = 45;

var N_ANTS = 20;
var N_DWARVES = 20;

make_grid = function(h, w, fn) {
    grid = [];
    for (var i = 0; i < h; i++) {
        row = [];
        grid.push(row);
        for (var j = 0; j < w; j++) {
            row.push(fn());
        }
    }
    return(grid);
}

grid_nodes = function(h, w) {
    nodes = [];
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            nodes.push([i, j]);
        }
    }
    return(nodes);
}

grid_edges = function(h, w) {
    var edges = [];
    for (var i = 0; i < h; i++) {
        for (var j = 1; j < w; j++) {
            var node = j+i*w;
            var l_row = i;
            var l_col = j-1;
            var l_node = l_col+l_row*w;
            edges.push([l_node, node]);
        }
    }
    for (var i = 1; i < h; i++) {
        for (var j = 0; j < w; j++) {
            var node = j+i*w;
            var u_row = i-1;
            var u_col = j;
            var u_node = u_col+u_row*w;
            edges.push([u_node, node]);
        }
    }
    return(edges);
}

randint = function(start, end) {
    // start inclusive, end exclusive
    return(start+Math.floor((end-start)*Math.random()));
}

shuffle = function(arr) {
    for (var i = 0; i < arr.length-1; i++) {
        var j = randint(i+1, arr.length);
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

find = function(parents, x) {
    var p = parents[x];
    if (x === p) {
        return(x);
    }
    var root = find(parents, p);
    parents[x] = root;
    return(root);
}

union = function(parents, x, y) {
    var xroot = find(parents, x);
    var yroot = find(parents, y);
    if (xroot === yroot) {
        return(false);
    }
    parents[xroot] = yroot;
    return(true);
}

random_spanning_tree = function(nodes, edges) {
    var parents = [];
    for (var i = 0; i < nodes.length; i++) {
        parents.push(i);
    }
    var work_edges = edges.slice();
    shuffle(work_edges);
    var spanning_edges = [];
    for (var i = 0; i < edges.length; i++) {
        var edge = work_edges[i];
        var distinct = union(parents, edge[0], edge[1]);
        if (distinct) {
            spanning_edges.push(edge);
        }
    }
    return(spanning_edges);
}

Vue.component('maze-cell', {
    props: ['cell'],
    computed: {
        disp: function() {
            if (this.cell.wall) {
                return('cell wall');
            } else if (this.cell.ants > 0) {
                if (this.cell.bigants > 0) {
                    return('cell bigant');
                }
                return('cell ant');
            } else if (this.cell.dwarves > 0) {
                return('cell dwarf');
            } else {
                return('cell empty');
            }
        },
        color: function() {
            return(new Color({
                red: this.cell.pheromoneA,
                green: this.cell.pheromoneD,
                blue: this.cell.pheromoneF,
                alpha: 1
            }).toCSS());
        }
    },
    template: '<td v-bind:style="{ backgroundColor: color }"><div v-bind:class="disp"></div></td>'
});

make_cell = function(wall, queen) {
    return {
        ants: 0,
        bigants: 0,
        dwarves: 0,
        pheromoneA: 0,
        pheromoneD: 0,
        pheromoneF: 0,
        queen: queen,
        wall: wall
    };
}

make_empty = function() {
    return(make_cell(false, false));
}

make_queen = function() {
    return(make_cell(false, true));
}

make_wall = function() {
    return(make_cell(true, false));
}

random_maze = function(h, w) {
    var grid = make_grid(2*h+1, 2*w+1, make_wall);
    for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
            grid[2*i+1][2*j+1] = make_empty();
        }
    }
    //grid[1][1] = make_queen();
    var nodes = grid_nodes(h, w);
    var edges = grid_edges(h, w);
    var spanning_edges = random_spanning_tree(nodes, edges);
    for (var i = 0; i < spanning_edges.length; i++) {
        var edge = spanning_edges[i];
        var lnode = nodes[edge[0]];
        var rnode = nodes[edge[1]];
        var dr = 2*lnode[0] + 1 + (rnode[0]-lnode[0]);
        var dc = 2*lnode[1] + 1 + (rnode[1]-lnode[1]);
        grid[dr][dc].wall = false;
    }
    for (var i = 0; i < N_ANTS; i++) {
        spawn_ant(grid, 1, 1);
    }
    for (var i = 0; i < N_DWARVES; i++) {
        spawn_dwarf(grid, 2*h-1, 2*w-1);
    }
    spawn_evaporate(grid);
    spawn_diffusion(grid);
    return(grid);
}

choose = function(choices, weights) {
    if (Math.random() < 0.01) {
        return(choices[Math.floor(choices.length*Math.random())]);
    }
    var total_weight = 0;
    for (var i = 0; i < weights.length; i++) {
        total_weight += weights[i];
    }
    var pick = total_weight*Math.random();
    for (var i = 0; i < weights.length; i++) {
        pick -= weights[i];
        if (pick < 0) {
            return(choices[i]);
        }
    }
    return(choices[Math.floor(choices.length*Math.random())]);
}

is_valid = function(grid, row, col) {
    if (row >= 0 && row < grid.length &&
        col >= 0 && col < grid[0].length) {
        if (grid[row][col].wall) {
            return(false);
        }
        return(true);
    }
    return(false);
}

var MOVES = [[-1, 0], [1, 0], [0, -1], [0, 1], [0, 0]];

pick_next = function(grid, srow, scol, eval_fn, lastdr, lastdc) {
    var choices = [];
    var weights = [];
    for (var i = 0; i < MOVES.length; i++) {
        var crow = srow+MOVES[i][0];
        var ccol = scol+MOVES[i][1];
        if (is_valid(grid, crow, ccol)) {
            choices.push(MOVES[i]);
            if (MOVES[i][0] === -lastdr &&
                MOVES[i][1] === -lastdc) {
                weights.push(0);
            } else {
                weights.push(eval_fn(grid[crow][ccol]));
            }
        }
    }
    return(choose(choices, weights));
}

ant_eval_cell = function(cell) {
    if (cell.wall) {
        return(0);
    } else {
        var bonus = 0;
        if (cell.dwarves > 0) {
            bonus = 10;
        }
        return(Math.exp(-100*cell.pheromoneA+80*cell.pheromoneD+
                        10*cell.pheromoneF+bonus));
    }
}

bigant_eval_cell = function(cell) {
    if (cell.wall) {
        return(0);
    } else {
        return(Math.exp(-120*cell.pheromoneF+100*cell.pheromoneA));
    }
}

spawn_ant = function(grid, srow, scol) {
    var is_big = false;
    var lastdr = 0;
    var lastdc = 0;
    var row = srow+lastdr;
    var col = scol+lastdc;
    grid[row][col].ants += 1;
    var update_ant = function() {
        if (grid[row][col].ants <= 0) {
            return;
        }
        grid[row][col].ants -= 1;
        if (is_big) {
            grid[row][col].bigants -= 1;
            grid[row][col].pheromoneF += 0.03;
        } else {
            grid[row][col].pheromoneA += 0.03;
        }
        var eval_fn = is_big ? bigant_eval_cell : ant_eval_cell;
        var next = pick_next(grid, row, col, eval_fn,
                             lastdr, lastdc);
        lastdr = next[0];
        lastdc = next[1];
        row += lastdr;
        col += lastdc;
        //if (is_big && grid[row][col].queen) {
        //    return;
        //}
        grid[row][col].ants += 1;
        if (grid[row][col].dwarves > 0 && !is_big) {
            grid[row][col].dwarves -= 1;
            is_big = true;
            lastdr *= -1;
            lastdc *= -1;
        }
        if (is_big) {
            grid[row][col].bigants += 1;
        }
    }
    setInterval(update_ant, 100);
}

dwarf_eval_cell = function(cell) {
    if (cell.wall) {
        return(0);
    } else if (cell.ants > 0) {
        return(0)
    } else {
        return(Math.exp(-10*cell.pheromoneA-cell.pheromoneD));
    }
}

spawn_dwarf = function(grid, srow, scol) {
    grid[srow][scol].dwarves += 1;
    var row = srow;
    var col = scol;
    var update_dwarf = function() {
        if (grid[row][col].dwarves <= 0) {
            return;
        }
        grid[row][col].pheromoneD += 0.1;
        grid[row][col].dwarves -= 1;
        var next = pick_next(grid, row, col, dwarf_eval_cell, -2, -2);
        row += next[0];
        col += next[1];
        grid[row][col].dwarves += 1;
    }
    setInterval(update_dwarf, 300);
}

evaporate = function(cell) {
    cell.pheromoneA -= 0.003*cell.pheromoneA;
    cell.pheromoneD -= 0.01*cell.pheromoneD;
    cell.pheromoneF -= 0.003*cell.pheromoneF;
}

spawn_evaporate = function(grid) {
    var run_evaporate = function() {
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                evaporate(grid[i][j]);
            }
        }
    }
    setInterval(run_evaporate, 300);
}

spawn_diffusion = function(grid) {
    var run_diffusion = function() {
        for (var i = 0; i < grid.length; i++) {
            for (var j = 0; j < grid[i].length; j++) {
                if (is_valid(grid, i, j)) {
                    for (var k = 0; k < MOVES.length; k++) {
                        var move = MOVES[k];
                        var crow = i+move[0];
                        var ccol = j+move[1];
                        if (is_valid(grid, crow, ccol)) {
                            var amnt = 0.03*grid[i][j].pheromoneD;
                            grid[i][j].pheromoneD -= amnt;
                            grid[crow][ccol].pheromoneD += amnt;
                        }
                    }
                }
            }
        }
    }
    setInterval(run_diffusion, 300);
}

var app = new Vue({
    el: '#app',
    data: {
        grid: random_maze(HEIGHT, WIDTH)
    }
})
