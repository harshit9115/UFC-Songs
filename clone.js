let currentSong = new Audio();
let songs;
let currfolder;

let repeatMode = 0; // 0 = off, 1 = one, 2 = all - Yeh naya variable add karein
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60); // यह लाइन अनकमेंट करें

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}
async function getSongs(folder) {
    currfolder = folder;
    currfolder = folder;
    let metadata = {}; // मेटाडेटा स्टोर करने के लिए

    try {
        // info.json लोड करें
        const metaRes = await fetch(`http://127.0.0.1:3000/${folder}/info.json`);
        metadata = await metaRes.json();
    } catch (e) {
        console.log("No metadata found, using defaults");
        metadata = {
            artist: "Unknown Artist",
            description: ""
        };
    }


    let a = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];

    // MP3 फाइल्स को songs ऐरे में इकट्ठा करें
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            let songName = element.href.split(`/${folder}/`)[1];
            songs.push(decodeURIComponent(songName));
        }
    }

    // सॉन्ग लिस्ट को DOM में डिस्प्ले करें
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = ""; // पहले की लिस्ट को क्लियर करें

    // प्रत्येक सॉन्ग के लिए HTML बनाएं
    for (const song of songs) {
        songUL.innerHTML += `<li data-song="${encodeURIComponent(song)}">
            <div class="song-info">
              <div class="song-title">${song.replace(".mp3", "").replace(/\s*128\s*Kbps/i, "")}</div>
                 <div class="song-artist">${metadata.artist || " "}</div>
                ${metadata.description ? `<div class="song-description">${metadata.description}</div>` : ''}
            </div>
            <button class="play-btn">
                <span class="play-text">Play Now</span>
                <span class="play-icon">▶</span>
            </button>
        </li>`;
    }

    // नया इवेंट हैंडलर जोड़ें
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const li = this.closest('li');
            const song = li.dataset.song;

            // सभी बटन्स को रिसेट करें
            document.querySelectorAll('.play-btn').forEach(b => {
                b.querySelector('.play-text').textContent = 'Play Now';
                b.querySelector('.play-icon').textContent = '▶';
            });

            // करंट सॉन्ग चेक करें
            if (currentSong.src.includes(song) && !currentSong.paused) {
                currentSong.pause();
                this.querySelector('.play-text').textContent = 'Play Now';
                this.querySelector('.play-icon').textContent = '▶';
            } else {
                playMusic(song);
                this.querySelector('.play-text').textContent = 'Playing';
                this.querySelector('.play-icon').textContent = '⏸';
            }
        });
    });

    return songs; // अंत में songs ऐरे को रिटर्न करें
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currfolder}/` + track;
    if (!pause) {
        currentSong.play();
        // Update main play button
        if (play) {
            play.src = "img/pause.svg";
        }
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track.replace(".mp3", "").replace(/\s*128\s*Kbps/i, ""));
    document.querySelector(".songtime").innerHTML = "00:00/00:00";

    // ... rest of your existing code ...
};
function playNextSong() {
    if (!songs || songs.length === 0) return;

    let currentSongName = decodeURIComponent(currentSong.src.split('/').pop());
    let index = songs.indexOf(currentSongName);

    if (index === -1) {
        // अगर करंट सॉन्ग लिस्ट में नहीं मिला तो पहला सॉन्ग प्ले करें
        playMusic(songs[0]);
    } else if (index + 1 < songs.length) {
        playMusic(songs[index + 1]);
    } else if (repeatMode === 2) {
        // रिपीट ऑल मोड में लास्ट सॉन्ग के बाद फर्स्ट सॉन्ग प्ले करें
        playMusic(songs[0]);
    }
}

async function displayAlbums() {  //  its very important function 
    // Show one "Trend" card from a folder called "trends/Deep Sleeping"
    const trendContainer = document.querySelector(".trendcontainer");
    const trendFolder = "songtrends";
    try {
        const trendMetaRes = await fetch(`http://127.0.0.1:3000/trends/${trendFolder}/info.json`);
        const trendMeta = await trendMetaRes.json();

    } catch (e) {
        console.warn("Trend image missing or invalid info.json");
    }

    // trends folders auto-fetch
    try {
        let a = await fetch(`http://127.0.0.1:3000/trends/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");

        for (let e of anchors) {
            if (e.href.includes("/trends/") && !e.href.endsWith("/trends/")) {
                let folder = e.href.split('/').filter(part => part.trim() !== '').pop();

                if (folder.startsWith('.') || folder === 'desktop.ini') continue;

                try {
                    let trendMetaRes = await fetch(`http://127.0.0.1:3000/trends/${folder}/info.json`);
                    let trendMeta = await trendMetaRes.json();

                    trendContainer.innerHTML += `
                     <div class="trend" data-folder="trends/${folder}">
                <div class="play">
                 <img src="img/play.svg" alt="">
                 </div>
                 <img src="/trends/${folder}/${trendMeta.cover || 'cover.jpg'}"
                  onerror="this.src='img/default-cover.jpg'"
                  alt="${trendMeta.Title || folder}">
                  <h3>${trendMeta.Title || folder}</h3>
                   <p>${trendMeta.description || 'No description available'}</p>
                 </div>`;
                } catch (err) {
                    trendContainer.innerHTML += ` 
                      <div class="trend" data-folder="trends/${folder}">
                   <div class="play">
             <img src="img/play.svg" alt="">
          </div>
          <img src="/trends/${folder}/${trendMeta.cover || 'cover.jpg'}"
           onerror="this.src='img/default-cover.jpg'"
           alt="${trendMeta.Title || folder}">
            <h3>${trendMeta.Title || folder}</h3>
            <p>${trendMeta.description || 'No description available'}</p>
            </div>`;

                }
            }
        }

    } catch (error) {
        console.warn("Error loading trends folder:", error);
    }


    try {

        let a = await fetch(`http://127.0.0.1:3000/songs/`);
        let response = await a.text();
        let div = document.createElement("div");
        div.innerHTML = response;
        let anchors = div.getElementsByTagName("a");
        let cardcontainer = document.querySelector(".cardcontainer");
        cardcontainer.innerHTML = "";

        for (let e of anchors) {
            if (e.href.includes("/songs/") && !e.href.endsWith("/songs/")) {
                let folder = e.href.split('/').filter(part => part.trim() !== '').pop();

                // Skip hidden/system files
                if (folder.startsWith('.') || folder === 'desktop.ini') continue;

                try {
                    // Fetch metadata with proper error handling
                    let metadataResponse = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);

                    // Check if response is actually JSON
                    const contentType = metadataResponse.headers.get('content-type');
                    if (!contentType || !contentType.includes('application/json')) {
                        throw new Error("Response is not JSON");
                    }

                    let metadata = await metadataResponse.json();

                    // Create card with metadata
                    cardcontainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <img src="img/play.svg" alt="">
                            </div>
                            <img src="/songs/${folder}/${metadata.cover || 'cover.jpg'}" 
                                 alt="${metadata.Title || folder}" 
                                 onerror="this.src='img/default-cover.jpg'">
                            <h3>${metadata.Title || folder}</h3>
                            <p>${metadata.description || 'No description available'}</p>
                        </div>`;

                } catch (error) {
                    console.log(`Using fallback for ${folder}:`, error);
                    // Fallback card when info.json is missing/invalid
                    cardcontainer.innerHTML += `
                        <div data-folder="${folder}" class="card">
                            <div class="play">
                                <img src="img/play.svg" alt="">
                            </div>
                            <img src="/songs/${folder}/cover.jpg" 
                                 alt="${folder}" 
                                 onerror="this.src='default-cover.jpg'">
                            <h3>${folder}</h3>
                            <p>No description available</p>
                        </div>`;
                }
            }
        }

        // Add event listeners to new cards
        addCardEventListeners();

    } catch (error) {
        console.error("Failed to load albums:", error);
        cardcontainer.innerHTML = `<div class="error">Failed to load playlists. Please refresh the page.</div>`;
    }

}  // the important function end

 


function addCardEventListeners() {
    Array.from(document.querySelectorAll(".card, .trend")).forEach(element => {
        element.addEventListener("click", async () => {
            const folder = element.dataset.folder;
            if (folder) {
                await getSongs(folder.startsWith("songs/") || folder.startsWith("trends/")
                    ? folder
                    : `songs/${folder}`);

                if (songs.length > 0) {
                    playMusic(songs[0]);
                }
            }
        });
    });
}









async function main() {
    //get list of all songs 
    await getSongs("songs/ncs")

    playMusic(songs[0], true)

    // display all songs on the page 
    displayAlbums()

    // attach an event lisetner to play, next and previous
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play()
            play.src = "img/pause.svg"
        }

        else {
            currentSong.pause()
            play.src = "img/play (2).svg"
        }
    })

    // listen for time update even
    currentSong.addEventListener("timeupdate", () => {


        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(currentSong.currentTime)}/
            ${secondsToMinutesSeconds(currentSong.duration)}`

        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";

    })
    // जब गाना खत्म हो जाए
    currentSong.addEventListener("ended", () => {
        if (repeatMode === 1) {
            // Repeat One
            playMusic(songs[songs.indexOf(decodeURIComponent(currentSong.src.split('/').pop()))]);
        } else if (repeatMode === 2) {
            // Repeat All
            let index = songs.indexOf(decodeURIComponent(currentSong.src.split('/').pop()));
            if (index + 1 < songs.length) {
                playMusic(songs[index + 1]);
            } else {
                playMusic(songs[0]);
            }
        }
    });


    // add event listener in seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    });
    // add event listener in hamburger
    // Toggle sidebar on hamburger (3-dot icon) click
    document.querySelector(".hamburger").addEventListener("click", () => {
        const leftPanel = document.querySelector(".left");
        if (leftPanel.style.left === "0px") {
            leftPanel.style.left = "-120%";  // Hide
        } else {
            leftPanel.style.left = "0";      // Show
        }
    });




    // add an event listener previous and next
    previous.addEventListener("click", () => {
        if (!songs || songs.length === 0) return;

        let currentSongName = decodeURIComponent(currentSong.src.split('/').pop());
        let index = songs.indexOf(currentSongName);

        if (index === -1) {

            playMusic(songs[songs.length - 1]);
        } else if (index > 0) {
            playMusic(songs[index - 1]);
        } else if (repeatMode === 2) {

            playMusic(songs[songs.length - 1]);
        }
    });
    next.addEventListener("click", () => {
        if (repeatMode !== 1) { // Only go to next if not in repeat-one mode
            let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
            if ((index + 1) < songs.length) {
                playMusic(songs[index + 1]);
            } else if (repeatMode === 2) {
                // If last song and repeat all, go to first song
                playMusic(songs[0]);
            }
        }
    });
    // add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0]
        .addEventListener("input", (e) => {  // "change" की जगह "input" का उपयोग करें
            const volumeValue = parseInt(e.target.value);
            currentSong.volume = volumeValue / 100;


            // वॉल्यूम प्रतिशत दिखाने के लिए
            const volumeDisplay = document.querySelector(".volume-display");
            if (volumeDisplay) {
                volumeDisplay.textContent = `${volumeValue}`;
            }
        });
    // load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log(item, item.currentTarget.dataset.folder)
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)

        })
    })

    // add event mute to volume button

    document.querySelector(".volume>img").addEventListener("click", e => {

        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 5;
        }

    })

    // Repeat button click
      // Repeat button click
const repeatBtn = document.querySelector(".repeat-btn img");
repeatBtn.addEventListener("click", () => {
    repeatMode = (repeatMode + 1) % 3; // 0 → 1 → 2 → 0
    if (repeatMode === 0) {
        repeatBtn.src = "repeatoff.svg"; // तुम्हारे icon का नाम repeat off के लिए
        console.log("Repeat Off");
    } else if (repeatMode === 1) {
        repeatBtn.src = "repeatone.svg"; // तुम्हारे icon का नाम repeat one के लिए
        console.log("Repeat One");
    } else if (repeatMode === 2) {
        repeatBtn.src = "repeatall.svg"; // तुम्हारे icon का नाम repeat all के लिए
        console.log("Repeat All");
    }
});

// जब गाना खत्म हो जाए
currentSong.addEventListener("ended", () => {
    if (repeatMode === 1) {
        // Repeat One
        playMusic(songs[songs.indexOf(decodeURIComponent(currentSong.src.split('/').pop()))]);
    } else if (repeatMode === 2) {
        // Repeat All
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split('/').pop()));
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            playMusic(songs[0]);
        }
    }
});





}

main()
