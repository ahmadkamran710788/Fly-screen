"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'tr' | 'en';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    tr: {
        // General
        "Order Number": "Sipariş Numarası",
        "First Name": "Adı",
        "Last Name": "Soyadı",
        "Store": "Mağaza",
        "Order Date": "Sipariş Tarihi",
        "Items": "Parçalar",
        "item": "parça",
        "Print Order": "Yazdır",
        "Delete Order": "Siparişi Sil",
        "Back to Orders": "Siparişlere Dön",
        "Order Items": "Sipariş Kalemleri",
        "Item": "Kalem",
        "Shipping Status": "Sevkiyat Durumu",
        "Frame": "Çerçeve",
        "Mesh": "Tül",
        "Quality": "Kalite",
        "Assembly": "Montaj",
        "Packaging": "Paketleme",
        "Box": "Koli",
        "Delete": "Sil",
        "Cancel": "İptal",
        "Dimensions": "Boyutlar",
        "Weight": "Ağırlık",
        "Contains": "İçerik",
        "Delete Order?": "Siparişi Sil?",
        "This action cannot be undone.": "Bu işlem geri alınamaz.",
        "Are you sure you want to delete order": "Siparişi silmek istediğinize emin misiniz?",
        "All associated items and boxes will be permanently removed.": "İlişkili tüm kalemler ve koliler kalıcı olarak silinecektir.",
        "This action cannot be undone. This will permanently delete the box and its contents from this order.": "Bu işlem geri alınamaz. Bu koli ve içeriği bu siparişten kalıcı olarak silinecektir.",

        // Box Management
        "Box Details": "Koli Bilgileri",
        "Add Box": "Koli Ekle",
        "Add New Box": "Yeni Koli Ekle",
        "Length": "Boy",
        "Width": "En",
        "Height": "Yükseklik",
        "Items in this box": "Bu kolideki kalemler",
        "Save Box": "Koliyi Kaydet",
        "No boxes added yet": "Henüz koli eklenmedi",
        "Click \"Add Box\" to create a package": "Paket oluşturmak için \"Koli Ekle\"ye tıklayın",

        // Quality View
        "EKSTRA KONTROL": "EKSTRA KONTROL",

        // View Titles
        "Sawing (Frame Cutting)": "Testere (Çerçeve Kesim)",
        "Mesh Cutting": "Tül Kesimi",

        // Labels
        "En": "En",
        "Boy": "Boy",
        "Kanat": "Kanat",
        "Profil renk": "Profil renk",
        "Yon": "Yon",
        "Kurulum": "Kurulum",
        "Esik": "Eşik",
        "Pile sayisi": "Pile sayısı",
        "Ip uzunlugu": "İp uzunluğu",
        "Serit Kanal": "Şerit Kanal",
        "Serit Kanat": "Şerit Kanat",
        "Tul": "Tül",
        "Perde türü": "Perde türü",
        "Kumas renk": "Kumaş renk",
        "Takoz ve kapak": "Takoz ve kapak",
        "Kapanma": "Kapanma",
        "Montaj": "Montaj",
        "Original width": "Orijinal en",
        "Original height": "Orijinal boy",
        "Width - 7": "En - 7",
        "Height - 7": "Boy - 7",
        "Width ÷ 2": "En ÷ 2",
        "Height ÷ 2": "Boy ÷ 2",
        "Width + Height + 20": "En + Boy + 20",
        "Tül boy - 2": "Tül boy - 2",
        "Kanat - 1": "Kanat - 1",
        "Width - 3.4": "En - 3.4",
    },
    en: {
        // General
        "Order Number": "Order Number",
        "First Name": "First Name",
        "Last Name": "Last Name",
        "Store": "Store",
        "Order Date": "Order Date",
        "Items": "Items",
        "item": "item",
        "Print Order": "Print Order",
        "Delete Order": "Delete Order",
        "Back to Orders": "Back to Orders",
        "Order Items": "Order Items",
        "Item": "Item",
        "Shipping Status": "Shipping Status",
        "Frame": "Frame",
        "Mesh": "Mesh",
        "Quality": "Quality",
        "Assembly": "Assembly",
        "Packaging": "Packaging",
        "Box": "Box",
        "Delete": "Delete",
        "Cancel": "Cancel",
        "Dimensions": "Dimensions",
        "Weight": "Weight",
        "Contains": "Contains",
        "Delete Order?": "Delete Order?",
        "This action cannot be undone.": "This action cannot be undone.",
        "Are you sure you want to delete order": "Are you sure you want to delete order",
        "All associated items and boxes will be permanently removed.": "All associated items and boxes will be permanently removed.",
        "This action cannot be undone. This will permanently delete the box and its contents from this order.": "This action cannot be undone. This will permanently delete the box and its contents from this order.",

        // Statuses
        "Pending": "Pending",
        "Complete": "Complete",
        "In Progress": "In Progress",
        "Completed": "Completed",
        "In Transit": "In Transit",

        // Box Management
        "Box Details": "Box Details",
        "Add Box": "Add Box",
        "Add New Box": "Add New Box",
        "Length": "Length",
        "Width": "Width",
        "Height": "Height",
        "Items in this box": "Items in this box",
        "Save Box": "Save Box",
        "No boxes added yet": "No boxes added yet",
        "Click \"Add Box\" to create a package": "Click \"Add Box\" to create a package",

        // Quality View
        "EKSTRA KONTROL": "EXTRA CONTROL",

        // View Titles
        "Sawing (Frame Cutting)": "Sawing (Frame Cutting)",
        "Mesh Cutting": "Mesh Cutting",

        // Labels
        "En": "Width",
        "Boy": "Height",
        "Kanat": "Sash",
        "Profil renk": "Profile color",
        "Yon": "Orientation",
        "Kurulum": "Installation",
        "Esik": "Threshold",
        "Pile sayisi": "Pleat count",
        "Ip uzunlugu": "Cord length",
        "Serit Kanal": "Strip Channel",
        "Serit Kanat": "Strip Sash",
        "Tul": "Mesh",
        "Perde türü": "Curtain type",
        "Kumas renk": "Fabric color",
        "Takoz ve kapak": "Wedge and cover",
        "Kapanma": "Closure",
        "Montaj": "Mounting",
        "Original width": "Original width",
        "Original height": "Original height",
        "Width - 7": "Width - 7",
        "Height - 7": "Height - 7",
        "Width ÷ 2": "Width ÷ 2",
        "Height ÷ 2": "Height ÷ 2",
        "Width + Height + 20": "Width + Height + 20",
        "Tül boy - 2": "Mesh length - 2",
        "Kanat - 1": "Sash - 1",
        "Width - 3.4": "Width - 3.4",
    }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('tr');

    const t = (key: string): string => {
        return translations[language][key as keyof typeof translations['tr']] || key;
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (context === undefined) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
