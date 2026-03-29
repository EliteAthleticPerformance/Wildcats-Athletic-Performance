async function loadAthletes(){

const response = await fetch("data/athletes.csv");

const data = await response.text();

console.log(data);

}