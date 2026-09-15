namespace CineLog.Entity.DTOs
{
    public class ActivityDto
    {
        public string Username { get; set; } = string.Empty;
        
        // "watched" (izledi), "rated" (puan verdi), "created_list" (liste oluşturdu)
        public string ActionType { get; set; } = string.Empty;
        
        // İlgili filmin veya listenin adı
        public string ItemName { get; set; } = string.Empty;
        
        // Eğer bir filmse afişi gösterebilmek için
        public string? PosterPath { get; set; }

        // Puan verdiyse kaç verdi?
        public int? Rating { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
