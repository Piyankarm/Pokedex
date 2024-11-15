const urlParams = new URLSearchParams(window.location.search);
const pokemonName = urlParams.get('name');

async function fetchPokemonData(identifier) {
    try {
        console.log("Fetching Pokémon:", identifier); // Log the identifier

        if (!identifier) throw new Error("Invalid Pokémon identifier");

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${identifier}`);
        if (!response.ok) throw new Error("Pokémon not found");
        const data = await response.json();

        displayPokemonData(data);

        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        displayBreedingData(speciesData);
        displayDescription(speciesData); // Display description here

        const evolutionResponse = await fetch(speciesData.evolution_chain.url);
        const evolutionData = await evolutionResponse.json();
        displayEvolutionChain(evolutionData.chain);

        // Update navigation buttons
        updateNavigationButtons(data.id);
    } catch (error) {
        console.error("Failed to fetch Pokémon data:", error.message);
        document.getElementById("pokemon-name").innerText = "Pokémon not found";
    }
}

function updateNavigationButtons(currentId) {
    const prevId = currentId > 1 ? currentId - 1 : null; // Ensure previous ID is valid
    const nextId = currentId < 1010 ? currentId + 1 : null; // Ensure next ID is valid

    const prevButton = document.getElementById("prev-button");
    const nextButton = document.getElementById("next-button");

    // Update Previous Button
    if (prevId) {
        prevButton.disabled = false;
        prevButton.innerText = `Previous: #${prevId}`;
        prevButton.onclick = () => fetchPokemonData(prevId);
    } else {
        prevButton.disabled = true;
        prevButton.innerText = "No Previous Pokémon";
    }

    // Update Next Button
    if (nextId) {
        nextButton.disabled = false;
        nextButton.innerText = `Next: #${nextId}`;
        nextButton.onclick = () => fetchPokemonData(nextId);
    } else {
        nextButton.disabled = true;
        nextButton.innerText = "No Next Pokémon";
    }
}
// Function to display Pokémon data including stats with shortened labels
function displayPokemonData(data) {
    // Update Pokémon Name and Image
    document.getElementById("pokemon-name").innerText = data.name.toUpperCase();
    document.getElementById("pokemon-img").src = data.sprites.other['official-artwork'].front_default;
    
// Display Type(s) with color-coded containers and no commas between dual types
document.getElementById("pokemon-type").innerHTML = data.types
    .map(type => {
        const typeName = type.type.name.toLowerCase();
        return `<a href="type.html?type=${typeName}" class="pokemon-type ${typeName}">${typeName.toUpperCase()}</a>`;
    })
    .join(" ");  // Use a space instead of a comma between types
    // Display Height and Weight
    document.getElementById("pokemon-height").innerText = (data.height / 10) + " m";
    document.getElementById("pokemon-weight").innerText = (data.weight / 10) + " kg";

    // Display Abilities with links
    document.getElementById("pokemon-abilities").innerHTML = data.abilities
        .map(ability => `<a href="ability.html?name=${ability.ability.name}">${ability.ability.name}</a>`)
        .join(", ");

    // Clear previous stats if any
    const statsContainer = document.getElementById("pokemon-stats");
    statsContainer.innerHTML = "";

    // Define shortened names for stats
    const statLabels = {
        "hp": "HP",
        "attack": "Atk",
        "defense": "Def",
        "special-attack": "Sp. Atk",
        "special-defense": "Sp. Def",
        "speed": "Spd"
    };

    let totalStats = 0; // Variable to calculate total stats

    // Loop through each stat and create a row
    data.stats.forEach(stat => {
        totalStats += stat.base_stat; // Add to total stats

        const statRow = document.createElement("div");
        statRow.className = "stat-row"; // Add this class for styling

        // Create label element
        const statLabel = document.createElement("span");
        statLabel.className = "stat-label";
        statLabel.innerText = statLabels[stat.stat.name] || stat.stat.name;
        statRow.appendChild(statLabel);

        // Create bar container and set bar width
        const barContainer = document.createElement("div");
        barContainer.className = "bar-container";

        const statBar = document.createElement("div");
        statBar.className = "stat-bar";
        statBar.style.width = `${(stat.base_stat / 200) * 100}%`; // Scale to max 200
        statBar.style.marginLeft = "0"; // Ensure bars start at the same point

        // Set bar color based on value
        if (stat.base_stat < 30) {
            statBar.style.backgroundColor = "red";
        } else if (stat.base_stat >= 30 && stat.base_stat < 50) {
            statBar.style.backgroundColor = "orange";
        } else if (stat.base_stat >= 50 && stat.base_stat <= 90) {
            statBar.style.backgroundColor = "yellow";
        } else {
            statBar.style.backgroundColor = "green";
        }

        barContainer.appendChild(statBar);

        // Add numerical value at the end of the bar
        const statValue = document.createElement("span");
        statValue.className = "stat-value";
        statValue.innerText = stat.base_stat;

        statRow.appendChild(barContainer);
        statRow.appendChild(statValue);

        // Append the row to the stats container
        statsContainer.appendChild(statRow);
    });

    // Add total stats below
    const totalRow = document.createElement("div");
    totalRow.className = "stat-total";
    totalRow.innerHTML = `<b>Total:</b> ${totalStats}`;
    statsContainer.appendChild(totalRow);

    // Display moves
    displayMoves(data.moves);
}

function displayMoves(moves) {
    const levelUpMoves = moves.filter(move => move.version_group_details.some(detail => detail.move_learn_method.name === "level-up"));
    const tmMoves = moves.filter(move => move.version_group_details.some(detail => detail.move_learn_method.name === "machine"));

    const levelUpContainer = document.getElementById("moves-level-up");
    levelUpContainer.innerHTML = "";
    levelUpMoves.forEach(move => {
        const listItem = document.createElement("li");
        listItem.innerText = move.move.name;
        levelUpContainer.appendChild(listItem);
    });

    const tmContainer = document.getElementById("moves-tm");
    tmContainer.innerHTML = "";
    tmMoves.forEach(move => {
        const listItem = document.createElement("li");
        listItem.innerText = move.move.name;
        tmContainer.appendChild(listItem);
    });
}

async function displayBreedingData(speciesData) {
    // Map the egg groups to clickable links
    const eggGroupLinks = speciesData.egg_groups
        .map(group => `<a href="egggroup.html?name=${group.name}" class="egg-group-link">${group.name}</a>`)
        .join(", ");
    
    // Insert the clickable egg group links into the element
    document.getElementById("pokemon-egg-group").innerHTML = eggGroupLinks;

    // Display the gender ratio
    const femaleRatio = speciesData.gender_rate >= 0 
        ? `${speciesData.gender_rate * 12.5}% Female, ${100 - speciesData.gender_rate * 12.5}% Male` 
        : "Genderless";
    document.getElementById("pokemon-gender").innerText = femaleRatio;
}
if (pokemonName) {
    fetchPokemonData(pokemonName);
} else {
    document.getElementById("pokemon-name").innerText = "No Pokémon specified";
}
async function displayEvolutionChain(chain) {
    const evolutionContainer = document.getElementById("evolution-chain");
    evolutionContainer.innerHTML = ""; // Clear previous content

    // Recursive function to display evolution chain
    async function displayStep(evolutionStep, level = 0) {
        // Skip if no species information is available
        if (!evolutionStep.species || !evolutionStep.species.name) {
            console.error("Missing species data:", evolutionStep);
            return;
        }

        // Create a container for the current Pokémon in the evolution chain
        const pokemonContainer = document.createElement("div");
        pokemonContainer.className = `evolution-step level-${level}`;

        // Fetch species data
        const speciesResponse = await fetch(evolutionStep.species.url);
        const speciesData = await speciesResponse.json();

        // Fetch Pokémon data using species name
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesData.name}`);
        const pokemonData = await pokemonResponse.json();

        // Create and append the Pokémon image
        const pokemonImage = document.createElement("img");
        pokemonImage.className = "evolution-image";
        pokemonImage.alt = speciesData.name;
        pokemonImage.src = pokemonData.sprites.front_default || "placeholder.png";

        // Add click event to navigate to this Pokémon's details
        pokemonImage.addEventListener("click", () => {
            fetchPokemonData(evolutionStep.species.name); // Fetch data for the clicked Pokémon
        });

        // Create and append the Pokémon name
        const pokemonName = document.createElement("p");
        pokemonName.className = "evolution-name";
        pokemonName.innerText = speciesData.name.toUpperCase();

        // Add Pokémon image and name to the container
        pokemonContainer.appendChild(pokemonImage);
        pokemonContainer.appendChild(pokemonName);

        // Add the current Pokémon to the evolution container
        evolutionContainer.appendChild(pokemonContainer);

        // Check if evolution has any details (level or item required)
        if (evolutionStep.evolution_details && evolutionStep.evolution_details.length > 0) {
            evolutionStep.evolution_details.forEach(detail => {
                const requirementText = document.createElement("p");
                requirementText.className = "evolution-requirement";

                // Check for friendship or happiness evolution
                if (detail.min_happiness) {
                    requirementText.innerText = `Friendship/Happiness: ${detail.min_happiness}`;
                }
                // Check for evolution by level
                else if (detail.min_level) {
                    requirementText.innerText = `Level ${detail.min_level}`;
                }
                // Check for evolution by item
                else if (detail.item) {
                    requirementText.innerText = `Item: ${detail.item.name}`;
                }
                // Check for held item
                else if (detail.held_item) {
                    requirementText.innerText = `Held Item: ${detail.held_item.name}`;
                }
                // Check for time of day condition (Day or Night)
                else if (detail.time_of_day) {
                    requirementText.innerText = `Time of Day: ${detail.time_of_day}`;
                }

                pokemonContainer.appendChild(requirementText);
            });
        }

        // If this Pokémon has multiple evolutions (branching evolution), display arrows
        if (evolutionStep.evolves_to && evolutionStep.evolves_to.length > 0) {
            const arrowContainer = document.createElement("div");
            arrowContainer.className = "arrow-container";
            const arrow = document.createElement("span");
            arrow.className = "evolution-arrow";
            arrow.innerHTML = "&#x2193;"; // Downward arrow (↓)
            arrowContainer.appendChild(arrow);
            evolutionContainer.appendChild(arrowContainer);

            // Recursively display all evolutions (branching)
            for (let i = 0; i < evolutionStep.evolves_to.length; i++) {
                await displayStep(evolutionStep.evolves_to[i], level + 1); // Recursive call for each evolution branch
            }
        }
    }

    // Start displaying from the initial chain
    await displayStep(chain);
}
function displayDescription(speciesData) {
    const descriptionContainer = document.getElementById("pokemon-description");
    
    // Find English flavor text
    const englishEntry = speciesData.flavor_text_entries.find(entry => entry.language.name === "en");

    if (englishEntry) {
        // Replace unnecessary line breaks with spaces
        const cleanedText = englishEntry.flavor_text.replace(/[\n\f]/g, " ");
        descriptionContainer.innerText = cleanedText;
    } else {
        descriptionContainer.innerText = "No description available.";
    }
}