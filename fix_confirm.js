const fs = require('fs');
const path = 'C:/DEV/CineLog/cinelog-ui/src/pages/Profile.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const confirmImport = \(\) => \{[\s\S]*?\}, 1500\);\s*\};/;

const newFunc = 'const confirmImport = async () => {\n' +
'    setImportLoading(true);\n' +
'    const moviesToProcess = importPreview.slice(0, 20);\n' +
'    let csvContent = "MovieId,Rating\\n";\n' +
'    let foundCount = 0;\n' +
'    for (const movie of moviesToProcess) {\n' +
'        try {\n' +
'            const res = await api.get(/Movies/search?query=);\n' +
'            if (res.data && res.data.length > 0) {\n' +
'                let matched = res.data[0];\n' +
'                if (movie.year && movie.year !== "Bilinmiyor") {\n' +
'                    const yearMatch = res.data.find(m => m.releaseDate && m.releaseDate.startsWith(movie.year));\n' +
'                    if (yearMatch) matched = yearMatch;\n' +
'                }\n' +
'                csvContent += ${matched.id},5\\n;\n' +
'                foundCount++;\n' +
'            }\n' +
'        } catch(err) { console.error("TMDB Hatası", movie.title); }\n' +
'    }\n' +
'    if (foundCount === 0) { alert("Eşleşme bulunamadı!"); setImportLoading(false); return; }\n' +
'    const blob = new Blob([csvContent], { type: "text/csv" });\n' +
'    const formData = new FormData();\n' +
'    formData.append("file", blob, "mapped.csv");\n' +
'    try {\n' +
'        await api.post("/Interactions/import-ratings", formData, { headers: { "Content-Type": "multipart/form-data" }});\n' +
'        alert(Sihir Gerçekleşti! TMDB üzerinden  film eşleştirildi ve GERÇEK anlamda veritabanınıza kaydedildi! (Demo Limiti: 20));\n' +
'        window.location.reload();\n' +
'    } catch(err) { alert("Hata!"); setImportLoading(false); }\n' +
'};';

if (regex.test(content)) {
    content = content.replace(regex, newFunc);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Replaced function using regex');
} else {
    console.log('Regex did not match!');
}
