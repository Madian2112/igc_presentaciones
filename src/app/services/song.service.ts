import { Injectable } from "@angular/core"
import type { Song } from "../models/presentation.model"

@Injectable({
  providedIn: "root",
})
export class SongService {
  private songs: Song[] = [
    {
      id: "1",
      name: "Ruido",
      source: "Public/letras/Ruido.pptx",
      slideCount: 6,
      lyrics: [
        "🎵 RUIDO 🎵",
        "Verso 1:\nEn el silencio de la noche\nTu voz se escucha más\nCuando el mundo calla\nTú comienzas a hablar",
        "Coro:\nNo hay ruido que pueda\nAcallar tu amor\nNo hay sonido que logre\nOpacar tu voz",
        "Verso 2:\nEn medio del caos\nTú traes paz\nEn la tormenta\nTú me das tranquilidad",
        "Puente:\nSolo en Ti encuentro\nLa calma que necesito\nSolo en Ti hallo\nEl descanso prometido",
        "Final:\nTu amor es más fuerte\nQue cualquier ruido\nTu voz es más clara\nQue cualquier sonido",
      ],
      metadata: {
        artist: "Iglesia Local",
        genre: "Adoración",
        year: 2024,
      },
    },
    {
      id: "2",
      name: "Amazing Grace",
      source: "Public/letras/Amazing_Grace.pptx",
      slideCount: 4,
      lyrics: [
        "🎵 AMAZING GRACE 🎵",
        "Amazing grace, how sweet the sound\nThat saved a wretch like me\nI once was lost, but now am found\nWas blind, but now I see",
        "'Twas grace that taught my heart to fear\nAnd grace my fears relieved\nHow precious did that grace appear\nThe hour I first believed",
        "When we've been there ten thousand years\nBright shining as the sun\nWe've no less days to sing God's praise\nThan when we'd first begun",
      ],
      metadata: {
        artist: "John Newton",
        genre: "Himno Tradicional",
        year: 1779,
      },
    },
    {
      id: "3",
      name: "How Great Thou Art",
      source: "Public/letras/How_Great_Thou_Art.pptx",
      slideCount: 5,
      lyrics: [
        "🎵 HOW GREAT THOU ART 🎵",
        "O Lord my God, when I in awesome wonder\nConsider all the worlds thy hands have made\nI see the stars, I hear the rolling thunder\nThy power throughout the universe displayed",
        "Then sings my soul, my Savior God, to thee\nHow great thou art, how great thou art\nThen sings my soul, my Savior God, to thee\nHow great thou art, how great thou art",
        "When through the woods and forest glades I wander\nAnd hear the birds sing sweetly in the trees\nWhen I look down from lofty mountain grandeur\nAnd hear the brook and feel the gentle breeze",
        "And when I think that God, his Son not sparing\nSent him to die, I scarce can take it in\nThat on the cross, my burden gladly bearing\nHe bled and died to take away my sin",
      ],
      metadata: {
        artist: "Carl Boberg",
        genre: "Himno Tradicional",
        year: 1885,
      },
    },
    {
      id: "4",
      name: "Blessed Assurance",
      source: "Public/letras/Blessed_Assurance.pptx",
      slideCount: 3,
      metadata: {
        artist: "Fanny Crosby",
        genre: "Himno Tradicional",
        year: 1873,
      },
    },
    {
      id: "5",
      name: "Great Is Thy Faithfulness",
      source: "Public/letras/Great_Is_Thy_Faithfulness.pptx",
      slideCount: 4,
      metadata: {
        artist: "Thomas Chisholm",
        genre: "Himno Tradicional",
        year: 1923,
      },
    },
    {
      id: "6",
      name: "Holy Holy Holy",
      source: "Public/letras/Holy_Holy_Holy.pptx",
      slideCount: 3,
      metadata: {
        artist: "Reginald Heber",
        genre: "Himno Tradicional",
        year: 1826,
      },
    },
    {
      id: "7",
      name: "It Is Well",
      source: "Public/letras/It_Is_Well.pptx",
      slideCount: 4,
      metadata: {
        artist: "Horatio Spafford",
        genre: "Himno Tradicional",
        year: 1873,
      },
    },
    {
      id: "8",
      name: "Jesus Loves Me",
      source: "Public/letras/Jesus_Loves_Me.pptx",
      slideCount: 2,
      metadata: {
        artist: "Anna Bartlett Warner",
        genre: "Himno Infantil",
        year: 1860,
      },
    },
    {
      id: "9",
      name: "What A Friend We Have In Jesus",
      source: "Public/letras/What_A_Friend.pptx",
      slideCount: 4,
      metadata: {
        artist: "Joseph M. Scriven",
        genre: "Himno Tradicional",
        year: 1855,
      },
    },
    {
      id: "10",
      name: "Sublime Gracia",
      source: "Public/letras/Sublime_Gracia.pptx",
      slideCount: 5,
      metadata: {
        artist: "John Newton (Traducción)",
        genre: "Himno Tradicional",
        year: 1779,
      },
    },
  ]

  async loadAvailableSongs(): Promise<Song[]> {
    // Simulate loading from Public/letras/ directory
    await this.delay(1500)
    return [...this.songs]
  }

  async searchSongs(query: string): Promise<Song[]> {
    await this.delay(300)
    if (!query.trim()) return this.songs

    return this.songs.filter(
      (song) =>
        song.name.toLowerCase().includes(query.toLowerCase()) ||
        song.metadata?.artist?.toLowerCase().includes(query.toLowerCase()) ||
        song.metadata?.genre?.toLowerCase().includes(query.toLowerCase()),
    )
  }

  async getSongById(id: string): Promise<Song | undefined> {
    return this.songs.find((song) => song.id === id)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
