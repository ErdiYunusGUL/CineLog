const fs = require('fs');
const path = 'C:/DEV/CineLog/cinelog-ui/src/pages/Profile.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const confirmImport = async \(\) => \{[\s\S]*?\}, 1500\);\s*\};\s*/;
const regex2 = /const confirmImport = async \(\) => \{[\s\S]*?setImportLoading\(false\);\s*\n\s*\};/;

const newFunc = const confirmImport = async () => {
    setImportLoading(true);
    const moviesToProcess = importPreview.slice(0, 20);
    let foundCount = 0;
    
    for (const movie of moviesToProcess) {
        try {
            const res = await api.get(\/Movies/search?query=\\);
            if (res.data && res.data.length > 0) {
                let matched = res.data[0];
                if (movie.year && movie.year !== "Bilinmiyor") {
                    const yearMatch = res.data.find(m => m.release_date && m.release_date.startsWith(movie.year));
                    if (yearMatch) matched = yearMatch;
                }
                
                let director = "Bilinmiyor";
                let leadActor = "Bilinmiyor";
                try {
                    const credRes = await api.get(\/Movies/\/credits\);
                    const credits = credRes.data;
                    director = credits?.crew?.find(c => c.job === 'Director')?.name || "Bilinmiyor";
                    leadActor = credits?.cast?.[0]?.name || "Bilinmiyor";
                } catch(e) { console.error("Credits failed"); }

                const releaseYear = matched.release_date ? parseInt(matched.release_date.substring(0, 4)) : 0;
                const poster = matched.poster_path || "";
                const genre = matched.genre_ids && matched.genre_ids.length > 0 ? matched.genre_ids[0] : 0;

                await api.post('/Interactions/watched', {
                    movieId: matched.id,
                    movieTitle: matched.title,
                    posterPath: poster,
                    mainGenreId: genre,
                    runtimeMinutes: 120,
                    director: director,
                    leadActor: leadActor,
                    releaseYear: releaseYear
                });
                foundCount++;
            }
        } catch(err) { console.error("Error with", movie.title); }
    }
    
    if (foundCount === 0) { alert("Eşleşme bulunamadı!"); setImportLoading(false); return; }
    
    alert(\Mükemmel! TMDB üzerinden \ film TÜM KADRO (Yönetmen/Başrol) bilgileriyle eşleştirilip analiz motoruna işlendi! (Limit: 20)\);
    window.location.reload();
};;

if (regex2.test(content)) {
    content = content.replace(regex2, newFunc);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Replaced function using regex2');
} else {
    console.log('Regex did not match!');
}
