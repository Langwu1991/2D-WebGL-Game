////////////////////////////////////////////
// Date: 10/27/2016
// No: 0665005 & 0648304
// Name: Harsh Joshi & Lang Wu
//
// Title : Super Bug Zapper 2D
///////////////////////////////////////////



//---------For Game
var canvas; // Canvas element of the HTML.
var gl; // Element to use the shaders
var vBuffer; // Buffer for the vertices
var cBuffer; // Buffer for the color of the vertices
var index = 122; // Index for the buffer
var gameDelay = 250; // Speed of the game
var gamePoints = 0; // Points which computer gains because of the delay of the user clicks

//---------For Circle
var xCenterOfCircle; // xCoordinate of the center of the circle
var yCenterOfCircle; // yCoordinate of the center of the circle
var centerOfCircle; // Vertex of center of the circle
var radiusOfCircle = 0.8; // Radius of the center of the circle
var minBacteriaKillZone = 0.1; // Radius of the click zone allowed towards the center of the circle
var maxBacteriaKillZone = 0.1; // Radius of the click zone allowed towards edge of the bacteria
var ATTRIBUTES = 2; // Attributes to skip to index during the cache of the points
var noOfFans = 120; // Total no. of the triangle fans in the circle
var anglePerFan; // Angle between the two fans
var circleVertices = []; // It stores the vertices of the circle in this array
var noOfCircleVertices = 122; // Total no of the vertices in the circle
var circleStartLoc = 0; // It stores the start position of the circle in the index of buffer
var circleEndLoc = circleStartLoc + noOfCircleVertices; // It stores the end position of the circle in the index of buffer

//--------For Bacteria
var outerBacteriaVertices = []; // Stores all the vertices of the bacteria
var bacteriaVertices = []; // Stores the randomly generated bacteria vertices
var indexer = []; // It is used to generate random bacterias but not in the same location for a set of bacteria
var incrementer = []; // It is used to keep track of the points of the bacteria shown on the screen during the loop of the render function
var poisonIncrementer = []; // It is used for the outward movement of the poison
var noOfBacterias = 4; // Total number of the bacteria can be on the screen
var noOfBacteriaPoints = 120; // It is the total number of the bacteria points on the circumference
var noOfVerticesInEachBacteria = 10; // It the maximum number of the vertices in each bacteria to make 30 degrees
var noOfVerticesOfAllBacterias = noOfBacterias*noOfVerticesInEachBacteria; // It is the count on total number of vertices
var colors = []; // Colors for each bacteria generated randomly
var bacteriaStartLoc = circleEndLoc+1; // Count for the index of the vertex buffer for the bacteria
var bacteriaEndLoc = bacteriaStartLoc + noOfVerticesOfAllBacterias; // bacteria end location for the index in the buffer
var bacteriaClickedOn = []; // Stores the index of the bacteria on various bacteria which are clicked on
var poisonColor = vec4(0.0, 1.0, 0.001, 0.9); // It is the poison color- Green

//------------For click part
var clickPosition = vec2(0.0, 0.0); // Stores the coordinates of the click
var clickAngle = 0; // Stores the angle of the click
var clickDistance = 0; // Stores the distance of the click from the center of the circle

//------------Generic
var maxVertices = noOfVerticesOfAllBacterias + noOfCircleVertices; // Total number of the vertices to allocate the buffer size

//------------Gameplay
var noOfBacteriaKilled = 0; // It stores the number of the bacterai killed by the user
var timer = 30; // Sets the time limit for the game
var intervalValue; // Sets the time limit for the game
var noOfBacteriaAllowedToGrow = 3; // Sets the limit of the maximum number of the bacteria allowed to grow
var isAllowedBacteriaFullyGrown = false; // Sets the flag to check whether the user is loosing or not on condition of allowed bacteria to grow


// On load of the page event
window.onload = function init()
{
  canvas = document.getElementById( "gl-canvas" );

  // Initialize the canvas
  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  // Configure the Webgl
  gl.viewport( 0.0, 0.0, canvas.width, canvas.height );
  gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

  //  Load shaders and initialize attribute buffers

  var program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  //Initialize and cache the required data for the game
  generateRandomColors();
  createEmptyArrrayForBacteria();
  cacheCircleVertices();
  cacheOuterBacteriaVertices();
  cacheBacteriaVertices();

  // Handles the mount down event
  canvas.onmousedown = handleMouseDown;

  // Load the data into the GPU
  vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, 8*maxVertices, gl.STATIC_DRAW);

  // Associate out shader variables with our data buffer
  var vPosition = gl.getAttribLocation( program, "vPosition" ); // Vertex buffer
  gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, 16*maxVertices, gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor"); // Color buffer
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  gl.clear( gl.COLOR_BUFFER_BIT ); // Clear the buffer bit before starting the game
  initializeVariables();
  startTimer();
  render();
}

// It prints the timer sets the intervalValue
function printTimer()
{
  timer--;
  var timerValue = document.getElementById("timer");
  timerValue.innerHTML = timer;
}

// It sets the interval value of 1s for the game timer
function startTimer()
{
  intervalValue = setInterval("printTimer()",1000);
}

// Stops the timer and clears the interval
function stopTimer()
{
  clearInterval(intervalValue);
}

// Handles the mouse down event and stores the coordinates of the user
// Also calculates the distance from the center of the circle
function handleMouseDown(event)
{
  var audio = new Audio('./click.mp3');
  audio.play();
  clickPosition = vec2(2*event.clientX/canvas.width-1, 2*(canvas.height-event.clientY)/canvas.height-1);

  clickAngle = (Math.atan2(clickPosition[1],clickPosition[0]) * 180 / Math.PI);
  clickDistance = Math.sqrt(clickPosition[0]*clickPosition[0] + clickPosition[1]*clickPosition[1]);  // Pythagoras theorom to calculate

  if(clickAngle < 0) // If negative add 360 to make it easier for the later comparison
  clickAngle = 360+clickAngle;
  findClickedBacteria();
}

// Creates empty arrays for the individual bacteria to store ten vertices each in a two dimensional array
function createEmptyArrrayForBacteria()
{
  for(var i=0; i<noOfBacterias; i++)
  {
    bacteriaVertices.push([]);
  }
}

// Generates random color for the bacteria and stores it in the array
function generateRandomColors()
{
  colors = [];
  for(var i=0; i<noOfBacterias; i++)
  {
    colors.push(vec4(Math.random()*0.9, Math.random()*0.7, Math.random()*0.99, 0.85));
  }
}

// Generates random color for the single bacteria to replace the old one
function generateRandomColorForOneBacteria(noOfBacteria)
{
  colors[noOfBacteria] = vec4(Math.random()*0.9, Math.random()*0.7, Math.random()*0.99, 0.75);
}

// Cache the circle vertices to make the cricle using triangle fan
function cacheCircleVertices()
{
  xCenterOfCircle = 0;
  yCenterOfCircle = 0;
  centerOfCircle = vec2(0, 0);
  anglePerFan = (2*Math.PI) / noOfFans;
  circleVertices.push(centerOfCircle);

  for(var i = 0; i <= noOfFans; i++)
  {
    var index = ATTRIBUTES * i + 2;
    var angle = anglePerFan * (i+1);
    if(i%2 == 0)
    {
      var xCoordinate = xCenterOfCircle + Math.cos(angle) * (radiusOfCircle-0.005);
      var yCoordinate = yCenterOfCircle + Math.sin(angle) * (radiusOfCircle-0.005);
    }
    else {
      var xCoordinate = xCenterOfCircle + Math.cos(angle) * (radiusOfCircle+0.005);
      var yCoordinate = yCenterOfCircle + Math.sin(angle) * (radiusOfCircle+0.005);
    }
    var point = vec2(xCoordinate, yCoordinate);
    circleVertices.push(point);
  }
}

// Initialize required variables before the render function starts
function initializeVariables()
{
  for(var i =0; i<noOfBacterias; i++)
  {
    incrementer.push(0);
    bacteriaClickedOn.push(-1);
    poisonIncrementer.push(-1);
  }
}

// Cache the vertices for the bacteria on the outer circle
function cacheOuterBacteriaVertices()
{
  for(var i = 0; i <= noOfBacteriaPoints; i++)
  {
    var index = ATTRIBUTES * i + 2;
    var angle = anglePerFan * (i+1);
    var xCoordinate = xCenterOfCircle + Math.cos(angle) * (radiusOfCircle+0.018);
    var yCoordinate = yCenterOfCircle + Math.sin(angle) * (radiusOfCircle+0.018);
    var point = vec2(xCoordinate, yCoordinate);
    outerBacteriaVertices.push(point);
  }
}

// Random number is generated for the only one bacteria and is used for replacement
function getRandomNumberExcept()
{
  while(1)
  {
    var randomNo = Math.floor(Math.random() * noOfBacteriaPoints);
    if(indexer.indexOf(randomNo) == -1)
    return randomNo;
  }
}

// It will create bacteria having 10 points and stores it into the separate arrray in two dimensions
function cacheBacteriaVertices()
{
  for(var j = 0; j < noOfBacterias; j++)
  {
    var randomNo  = getRandomNumberExcept();
    if(j%10 == 0) // If bacteria is more than 10 then it will run out of the unique center point so generates new set of unique bacteria
    indexer = [];
    for(var i = 1; i <= noOfVerticesInEachBacteria/2; i++) // push two points on each side of the bacteria w.r.t to center point
    {
      if(i==1) // For the center point of the bacteria
      {
        bacteriaVertices[j].push(outerBacteriaVertices[randomNo]);
        indexer.push(randomNo);
      }

      if (randomNo - i < 0)
      {
        bacteriaVertices[j].push(outerBacteriaVertices[randomNo-i+noOfBacteriaPoints+1]);
        indexer.push(randomNo-i+noOfBacteriaPoints+1);
      }
      else
      {
        bacteriaVertices[j].push(outerBacteriaVertices[randomNo-i]);
        indexer.push(randomNo-i);
      }

      if(randomNo + i > noOfBacteriaPoints)
      {
        if(i != 5)
        {
          bacteriaVertices[j].push(outerBacteriaVertices[randomNo+i-noOfBacteriaPoints+1]);
          indexer.push(randomNo+i-noOfBacteriaPoints+1);
        }
      }
      else
      {
        if(i != 5)
        {
          bacteriaVertices[j].push(outerBacteriaVertices[randomNo+i]);
          indexer.push(randomNo+i);
        }
      }
    }
  }
}

// Use to generate a single bacteria comparing with the indexer for the replacement strategy.
function cacheBacteriaVerticesIndividually(replaceBacteriaNo)
{
  bacteriaVertices[replaceBacteriaNo] = []
  generateRandomColorForOneBacteria(replaceBacteriaNo);
  var randomNo  = getRandomNumberExcept();
  for(var i = 2*replaceBacteriaNo; i < 2*replaceBacteriaNo+11; i++)
  {
    indexer.splice(i, 1);
  }

  for(var i = 1; i <= noOfVerticesInEachBacteria/2; i++)
  {
    if(i==1)
    {
      bacteriaVertices[replaceBacteriaNo].push(outerBacteriaVertices[randomNo]);
      indexer.push(randomNo);
    }

    if (randomNo - i < 0)
    {
      bacteriaVertices[replaceBacteriaNo].push(outerBacteriaVertices[randomNo-i+noOfBacteriaPoints+1]);
      indexer.push(randomNo-i+noOfBacteriaPoints+1);
    }
    else
    {
      bacteriaVertices[replaceBacteriaNo].push(outerBacteriaVertices[randomNo-i]);
      indexer.push(randomNo-i);
    }

    if(randomNo + i > noOfBacteriaPoints)
    {
      if(i != 5)
      {
        bacteriaVertices[replaceBacteriaNo].push(outerBacteriaVertices[randomNo+i-noOfBacteriaPoints+1]);
        indexer.push(randomNo+i-noOfBacteriaPoints+1);
      }
    }
    else
    {
      if(i != 5)
      {
        bacteriaVertices[replaceBacteriaNo].push(outerBacteriaVertices[randomNo+i]);
        indexer.push(randomNo+i);
      }
    }
  }
}

// It finds the bacteria on which it is clicked and stores the
// multiple click information in the arrray when click on bacteria for multiple times
function findClickedBacteria()
{
  for(var i=0; i<noOfBacterias; i++)
  {
    var lastVertex = bacteriaVertices[i][incrementer[i]];
    var secondLastVertex = 0;
    if(incrementer[i] == 0)
    secondLastVertex = bacteriaVertices[i][incrementer[i]];
    else
    secondLastVertex = bacteriaVertices[i][incrementer[i]-1];

    var angleLastVertex = (Math.atan2(lastVertex[1], lastVertex[0]) * 180 / Math.PI);

    var angleSecondLastVertex = (Math.atan2(secondLastVertex[1], secondLastVertex[0]) * 180 / Math.PI);

    if(angleLastVertex < 0) // if angles are negative add 360 for easy calculation
    angleLastVertex = 360 + angleLastVertex;
    if(angleSecondLastVertex < 0) // if angles are negative add 360 for easy calculation
    angleSecondLastVertex = 360+ angleSecondLastVertex;

    // Condition to check for the 1st quadrant and 4th quadrant where condition changes
    // x1 > 0, x2 > 0, (y1 <0 , y2 > 0) or (y1 > 0 , y2 < 0)
    if( (lastVertex[0] > 0 && secondLastVertex[0] > 0)
    && ((lastVertex[1] < 0 && secondLastVertex[1] > 0) || (lastVertex[1] > 0 && secondLastVertex[1] < 0)))
    {
      if((clickAngle >= angleLastVertex && clickAngle >= angleSecondLastVertex)
      && (clickDistance >= radiusOfCircle-minBacteriaKillZone && clickDistance <= radiusOfCircle + maxBacteriaKillZone))
      {
        bacteriaClickedOn[i] = i;
        poisonIncrementer[i] = 0;
      }
    }
    else {
      // Condition to check the angle should be between the end points of the bacteria
      if(((clickAngle >= angleLastVertex && clickAngle <= angleSecondLastVertex)
      || (clickAngle >= angleSecondLastVertex && clickAngle <= angleLastVertex))
      && (clickDistance >= radiusOfCircle-minBacteriaKillZone && clickDistance <= radiusOfCircle + maxBacteriaKillZone))
      {
        bacteriaClickedOn[i] = i;
        poisonIncrementer[i] = 0;
      }
    }

  }
}

function drawBacteria()
{
  var noOfBacteriaFullyGrown = 0; // To check whether limit of the bacteria is fully grown or not

  //-------------Loop for the number of the bacteria to animate
  for(var i = 0; i<noOfBacterias; i++)
  {
    for(var j = 0; j<=incrementer[i]; j++) // Loop for the size of the bacteria to be displayed on the screen
    {
      // Bind the vertex buffer for the bacteria
      gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
      var v = bacteriaVertices[i][j];
      gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(v));

      // Bind the color buffer for the bacteria
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
      var c;
      if(bacteriaClickedOn[i] == i)
      {
        if(poisonIncrementer[i] != -1 && poisonIncrementer[i] <= j) // To poison the bacteria from the center towards the endpoints
        {
          c = colors[i];
        }
        else {
          c = poisonColor;
        }
      }
      else
      c = colors[i];
      gl.bufferSubData(gl.ARRAY_BUFFER, 16*index, flatten(c)); // Set color of the vertices on the allocated buffer space
      index++;
    }
  }
  //----------- Loop ends

  // ----------- Loop for the size of the bacteria at each instance
  // ----------- Also checks the click of the bacteria to decrement the size and finally generating the new bacteria
  // ----------- It stops the incrementer when bacteria reaches its maximum size of 30 degrees
  for(var i = 0; i<incrementer.length; i++)
  {
    if(bacteriaClickedOn[i] != -1) // Checks if bacteria is click upon
    {
      if(incrementer[bacteriaClickedOn[i]] <= 0) // Checks if bacteria is diminished
      {
        cacheBacteriaVerticesIndividually(bacteriaClickedOn[i]); // Create new bacteria and stores it in an array
        incrementer[bacteriaClickedOn[i]] = 0; // Set incrementer to 0 for new bacteria
        bacteriaClickedOn[i] = -1; // Set -1 to newly generated bacteria to state it as not clicked one
        noOfBacteriaKilled++; // Keeps track of the bacteria killed and increase it by one
        gamePoints += 5; // Increase game points by 5 if bacteria is killed
        setUserPoints(); // Displays user points
      }
      else
      {
        incrementer[bacteriaClickedOn[i]]--; // If bacteria is not diminished keeps on decreasing its size
      }
      poisonIncrementer[i]++; // Keeps on increasing the poison if bacteria is clicked
    }
    else { // if Bacteria is not clicked upon keeps on incrementing till the full size
      poisonIncrementer[i] = -1; // if bacteria is not clicked disabled poison effect
      if(incrementer[i]<9)
      {
        incrementer[i]++;
      }
    }
    if(incrementer[i]>=9)
    {
      noOfBacteriaFullyGrown++;
    }
  }
  // --------- Loop ends


  if(noOfBacteriaFullyGrown >= noOfBacteriaAllowedToGrow) // Checks if total number of the bacteria grown to full size are less or not
    isAllowedBacteriaFullyGrown = true;
  gl.drawArrays(gl.POINTS, circleEndLoc, index-circleEndLoc); // Draws the bacteria using the specified index of the buffer
  index = circleEndLoc; // again starts from the center
}

// Draws circle on every loop of the render
function drawCircle()
{
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferSubData(gl.ARRAY_BUFFER, circleStartLoc, flatten(circleVertices));

  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

  for(var i = 0; i<circleEndLoc; i++)
  {
    var c = vec4(Math.random()*0.4, Math.random()*0.4, Math.random()*0.4, 0.65); // Generates very random colors for the cirlce for the each vertices
    gl.bufferSubData(gl.ARRAY_BUFFER, 16*i, flatten(c));
  }
  gl.drawArrays(gl.TRIANGLE_FAN, circleStartLoc, circleEndLoc); // Draws the circle at the defined location in the buffer
}



function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT ); // Clear color buffer bit

  drawBacteria();
  drawCircle();

  gamePoints = gamePoints+0.5; // Game gains points on every loop
  setGamePoints();

  if(timer <= 0 || isAllowedBacteriaFullyGrown)
  {
    if(isAllowedBacteriaFullyGrown || noOfBacteriaKilled*10 < gamePoints) // If specified number of bacteria increase to its maximum length or game has more points than user, user lose
    {
      document.getElementById("looseStatement").style.display = "block";
    }
    else if (noOfBacteriaKilled*10 > gamePoints) { // If user has more points has more points than game then user wins
      document.getElementById("winStatement").style.display = "block";
    }
    console.log(noOfBacteriaKilled + ', ' + gamePoints);
    // gl.clear( gl.COLOR_BUFFER_BIT );
    // drawCircle();
    stopTimer();
    return;
  }

  setTimeout(
    function (){requestAnimFrame(render);}, gameDelay // According to the delay render function will be called.
  );
}

// Displays user points
function setUserPoints()
{
  var points = document.getElementById("userPoints");
  points.innerHTML = noOfBacteriaKilled * 10;
  var bacterias = document.getElementById("bacteriaKilled");
  bacterias.innerHTML = noOfBacteriaKilled;
}

// Displays game points
function setGamePoints()
{
  gamePointsTitle = document.getElementById("gamePoints");
  gamePointsTitle.innerHTML = gamePoints.toFixed(2);
}
