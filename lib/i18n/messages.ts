export type Language =
  | "es"
  | "en";

export const messages = {
  es: {
    shell: {
      tagline:
        "Plataforma de análisis inteligente de reseñas hoteleras...",
    },

    navigation: {
      home:
        "Inicio",

      capture:
        "Captura",

      reviews:
        "Reviews",

      reports:
        "Informes",

      administration:
        "Administración",

      users:
        "Usuarios",

      entities:
        "Entidades",

      logout:
        "Cerrar sesión",

      loggingOut:
        "Cerrando...",
    },

    roles: {
      super_admin:
        "Super administrador",

      hotel_admin:
        "Administrador de hotel",

      manager:
        "Manager",

      operator:
        "Operador",
    },

    common: {
      globalAccess:
        "Acceso global",
    },

    home: {
      eyebrow:
        "Inicio",

      title:
        "Panel principal",

      description:
        "Seleccione una de las áreas del sistema para comenzar.",

      capture: {
        category:
          "Operación",

        title:
          "Captura",

        description:
          "Descargue e importe nuevas reviews desde las fuentes configuradas.",
      },

      reviews: {
        category:
          "Gestión",

        title:
          "Reviews",

        description:
          "Revise las opiniones recibidas, analice su contenido y gestione las respuestas.",
      },

      reports: {
        category:
          "Inteligencia",

        title:
          "Informes",

        description:
          "Genere informes ejecutivos a partir de los hallazgos del período seleccionado.",
      },

      users: {
        category:
          "Administración",

        title:
          "Usuarios",

        description:
          "Gestione usuarios, roles y accesos del sistema.",
      },
    },

    capture: {
      page: {
        eyebrow:
          "Sincronización",

        title:
          "Captura de reviews",

        description:
          "Descarga e importa nuevas reseñas desde las fuentes configuradas.",
      },

      panel: {
        title:
          "Captura de reseñas",

        description:
          "Descargue, normalice, importe y analice automáticamente las reseñas asociadas a la entidad del usuario autenticado.",

        runButton:
          "Descargar e importar",

        runningButton:
          "Ejecutando pipeline...",

        defaultError:
          "No se pudo ejecutar el pipeline.",

        unexpectedError:
          "Error inesperado ejecutando el pipeline.",

        runningTitle:
          "Review Capture Pipeline en ejecución",

        runningDescription:
          "Este proceso puede tardar varios minutos porque DataForSEO crea y procesa una tarea por cada incremento de profundidad.",
      },

      result: {
        completed:
          "Proceso finalizado",

        insertedPrefix:
          "Se insertaron",

        insertedMiddle:
          "reseñas nuevas para",

        initialDepth:
          "Depth inicial",

        finalDepth:
          "Depth final",

        rounds:
          "Rondas",

        totalInserted:
          "Total insertadas",

        stopReason:
          "Motivo de finalización",

        table: {
          depth:
            "Depth",

          downloaded:
            "Descargadas",

          inserted:
            "Insertadas",

          duplicates:
            "Duplicadas",

          task:
            "Task",
        },
      },

      understanding: {
        title:
          "Review Understanding",

        description:
          "Resultado del análisis automático de las reseñas pendientes.",

        pendingAtStart:
          "Pendientes iniciales",

        processed:
          "Procesadas",

        analyzed:
          "Analizadas",

        findings:
          "Hallazgos",

        failed:
          "Fallidas",

        batches:
          "Lotes procesados",

        pendingAtEnd:
          "Pendientes restantes",

        allAnalyzed:
          "Todas las reseñas pendientes fueron analizadas correctamente.",

        failuresPrefix:
          "Se produjeron",

        failuresSuffix:
          "fallos durante el análisis.",

        pendingPrefix:
          "Quedaron",

        pendingSuffix:
          "reseñas pendientes de análisis.",
      },

      stopReasons: {
        sourceExhausted:
          "DataForSEO devolvió menos reseñas que la profundidad solicitada.",

        noNewReviews:
          "El último lote no contenía reseñas nuevas.",

        maxDepthReached:
          "Se alcanzó el límite máximo de profundidad configurado.",
      },
    },

    reviewsInbox: {
      eyebrow:
        "Reviews recibidas",

      title:
        "Bandeja de reviews",

      description:
        "Seleccione una review para analizarla y preparar su respuesta.",

      loading:
        "Cargando...",

      availableSuffix:
        "disponibles",

      searchPlaceholder:
        "Buscar por huésped, título, hotel o contenido...",

      searchAria:
        "Buscar reviews",

      sourceFilterAria:
        "Filtrar por fuente",

      statusFilterAria:
        "Filtrar por estado",

      allSources:
        "Todas las fuentes",

      openStatuses:
        "Pendientes de gestión",

      allStatuses:
        "Todos los estados",

      statuses: {
        new:
          "Nueva",

        pending:
          "Pendiente",

        in_review:
          "En revisión",

        approved:
          "Aprobada",

        published:
          "Publicada",
      },

      statusesPlural: {
        new:
          "Nuevas",

        pending:
          "Pendientes",

        in_review:
          "En revisión",

        approved:
          "Aprobadas",

        published:
          "Publicadas",
      },

      empty:
        "No hay reviews que coincidan con los filtros.",

      guest:
        "Huésped",

      priority:
        "Prioridad",

      untitled:
        "Review sin título",

      noText:
        "La review no contiene texto.",

      noDate:
        "Sin fecha",

      starsSuffix:
        "de 5 estrellas",

      loadErrorPrefix:
        "No se pudo cargar la bandeja:",
    },

    reviewDetail: {
      page: {
        back:
          "Volver a Reviews",

        unavailable:
          "Review no disponible",

        notFound:
          "No se encontró la review solicitada.",
      },

      reviewCard: {
        sourceAria:
          "Fuente de la review",

        loadingSources:
          "Cargando fuentes...",

        selectSource:
          "Seleccione una fuente",

        loading:
          "Cargando...",

        starsSuffix:
          "de 5 estrellas",

        statusAria:
          "Estado de la review",

        statuses: {
          new:
            "Nueva",

          inReview:
            "En revisión",

          approved:
            "Aprobada",

          published:
            "Publicada",
        },

        loadingGuest:
          "Cargando huésped...",

        loadingReview:
          "Cargando review...",
      },

      context: {
        eyebrow:
          "Contexto interno",

        title:
          "¿Qué debe saber la IA antes de responder?",

        optional:
          "Opcional",

        placeholder:
          "Ejemplo: El huésped llegó tres horas antes del check-in y el aire acondicionado fue reparado esa misma tarde.",

        stopRecording:
          "Detener grabación",

        explainByVoice:
          "Explicar por voz",

        recording:
          "Grabando demostración…",

        audioFuture:
          "La función de audio se conectará en la siguiente etapa.",
      },

      responseEditor: {
        eyebrow:
          "Borrador generado",

        title:
          "Respuesta propuesta",

        toneAria:
          "Tono de la respuesta",

        tones: {
          professional:
            "Profesional",

          warm:
            "Cálida",

          brief:
            "Breve",
        },

        translationLanguageAria:
          "Idioma de traducción",

        languages: {
          es:
            "Español",

          en:
            "Inglés",

          fr:
            "Francés",

          de:
            "Alemán",

          it:
            "Italiano",

          pt:
            "Portugués",

          ru:
            "Ruso",

          zh:
            "Chino simplificado",

          vi:
            "Vietnamita",
        },

        placeholder:
          "Pulse Generar respuesta para crear un borrador con IA.",

        generating:
          "Generando...",

        regenerate:
          "Regenerar respuesta",

        generate:
          "Generar respuesta",

        translating:
          "Traduciendo...",

        translate:
          "Traducir",

        restoreOriginal:
          "Restaurar original",

        copyAndOpen:
          "Copiar y abrir fuente",

        saving:
          "Guardando...",

        saveDraft:
          "Guardar borrador",

        noApprovalPermission:
          "Su rol no tiene permisos para aprobar respuestas.",

        approving:
          "Aprobando...",

        approve:
          "Aprobar respuesta",

        savedPrefix:
          "Borrador guardado para la fuente",
      },

      analysis: {
        eyebrow:
          "Análisis automático",

        title:
          "Resumen de la review",

        analyzingReview:
          "Analizando la review...",

        source:
          "Fuente",

        loading:
          "Cargando...",

        noSource:
          "Sin seleccionar",

        sentiment:
          "Sentimiento",

        analyzing:
          "Analizando...",

        priority:
          "Prioridad",

        emotion:
          "Emoción",

        recommendationProbability:
          "Probabilidad de recomendación",

        detectedAreas:
          "Áreas detectadas",

        noResults:
          "Sin resultados",

        positiveAspects:
          "Aspectos positivos",

        negativeAspects:
          "Aspectos negativos",

        executiveSummary:
          "Resumen ejecutivo",

        values: {
          sentiment: {
            very_positive: "Muy positivo",
            positive: "Positivo",
            neutral: "Neutral",
            moderately_negative: "Moderadamente negativo",
            very_negative: "Muy negativo",
          },

          priority: {
            low: "Baja",
            medium: "Media",
            high: "Alta",
            critical: "Crítica",
          },

          emotion: {
            satisfaction: "Satisfacción",
            gratitude: "Gratitud",
            enthusiasm: "Entusiasmo",
            neutral: "Neutral",
            disappointment: "Decepción",
            frustration: "Frustración",
            anger: "Enfado",
            concern: "Preocupación",
          },

          recommendationProbability: {
            very_low: "Muy baja",
            low: "Baja",
            medium: "Media",
            high: "Alta",
            very_high: "Muy alta",
          },

          areas: {
            cleanliness: "Limpieza",
            staff_service: "Servicio del personal",
            room: "Habitación",
            bathroom: "Baño",
            food_beverage: "Alimentos y bebidas",
            breakfast: "Desayuno",
            location: "Ubicación",
            facilities: "Instalaciones",
            maintenance: "Mantenimiento",
            comfort: "Confort",
            noise: "Ruido",
            wifi: "Wi-Fi",
            pool: "Piscina",
            beach: "Playa",
            value: "Relación calidad-precio",
            check_in: "Check-in",
            check_out: "Check-out",
            booking: "Reserva",
            accessibility: "Accesibilidad",
            security: "Seguridad",
            other: "Otros",
          },
        },
      },

      workflow: {
        eyebrow:
          "Flujo de trabajo",

        title:
          "Estado de gestión",

        steps: {
          captured:
            "Review capturada",

          analyzed:
            "Análisis realizado",

          responseReview:
            "Respuesta en revisión",

          approval:
            "Aprobación",

          manualPublication:
            "Publicación manual",
        },
      },

      workspace: {
        guest:
          "Huésped",

        unspecifiedProperty:
          "Propiedad no especificada",

        noTextToAnalyze:
          "La review no contiene texto para analizar.",

        analysisFailed:
          "No se pudo analizar la review.",

        invalidReviewId:
          "El identificador de la review no es válido.",

        sourcesLoadFailed:
          "No se pudieron cargar las fuentes:",

        reviewNotFound:
          "No se encontró la review.",

        invalidReviewText:
          "La review seleccionada no contiene texto válido.",

        responseGenerationFailed:
          "No se pudo generar la respuesta.",

        emptyResponse:
          "La respuesta no puede estar vacía.",

        translationFailed:
          "No se pudo traducir la respuesta.",

        responseRequired:
          "Primero debe generar o escribir una respuesta.",

        sourceUrlMissing:
          "Esta review no tiene una URL de origen.",

        copyOpenFailed:
          "No se pudo copiar la respuesta o abrir la review.",

        saveDraftFailed:
          "No se pudo guardar el borrador:",

        approvalFailed:
          "No se pudo aprobar la respuesta.",
      },
    },
  },

  en: {
    shell: {
      tagline:
        "Intelligent hotel review analysis platform...",
    },

    navigation: {
      home:
        "Home",

      capture:
        "Capture",

      reviews:
        "Reviews",

      reports:
        "Reports",

      administration:
        "Administration",

      users:
        "Users",

      entities:
        "Properties",

      logout:
        "Log out",

      loggingOut:
        "Logging out...",
    },

    roles: {
      super_admin:
        "Super administrator",

      hotel_admin:
        "Hotel administrator",

      manager:
        "Manager",

      operator:
        "Operator",
    },

    common: {
      globalAccess:
        "Global access",
    },

    home: {
      eyebrow:
        "Home",

      title:
        "Main dashboard",

      description:
        "Select one of the system areas to get started.",

      capture: {
        category:
          "Operations",

        title:
          "Capture",

        description:
          "Download and import new reviews from the configured sources.",
      },

      reviews: {
        category:
          "Management",

        title:
          "Reviews",

        description:
          "Review guest feedback, analyze its content, and manage responses.",
      },

      reports: {
        category:
          "Intelligence",

        title:
          "Reports",

        description:
          "Generate executive reports from the findings for the selected period.",
      },

      users: {
        category:
          "Administration",

        title:
          "Users",

        description:
          "Manage system users, roles, and access permissions.",
      },
    },

    capture: {
      page: {
        eyebrow:
          "Synchronization",

        title:
          "Review capture",

        description:
          "Download and import new reviews from the configured sources.",
      },

      panel: {
        title:
          "Review capture",

        description:
          "Download, normalize, import, and automatically analyze reviews associated with the authenticated user's property.",

        runButton:
          "Download and import",

        runningButton:
          "Running pipeline...",

        defaultError:
          "The pipeline could not be executed.",

        unexpectedError:
          "Unexpected error while running the pipeline.",

        runningTitle:
          "Review Capture Pipeline running",

        runningDescription:
          "This process may take several minutes because DataForSEO creates and processes a task for each depth increment.",
      },

      result: {
        completed:
          "Process completed",

        insertedPrefix:
          "Inserted",

        insertedMiddle:
          "new reviews for",

        initialDepth:
          "Initial depth",

        finalDepth:
          "Final depth",

        rounds:
          "Rounds",

        totalInserted:
          "Total inserted",

        stopReason:
          "Completion reason",

        table: {
          depth:
            "Depth",

          downloaded:
            "Downloaded",

          inserted:
            "Inserted",

          duplicates:
            "Duplicates",

          task:
            "Task",
        },
      },

      understanding: {
        title:
          "Review Understanding",

        description:
          "Results of the automatic analysis of pending reviews.",

        pendingAtStart:
          "Initially pending",

        processed:
          "Processed",

        analyzed:
          "Analyzed",

        findings:
          "Findings",

        failed:
          "Failed",

        batches:
          "Batches processed",

        pendingAtEnd:
          "Remaining pending",

        allAnalyzed:
          "All pending reviews were analyzed successfully.",

        failuresPrefix:
          "There were",

        failuresSuffix:
          "failures during the analysis.",

        pendingPrefix:
          "There are",

        pendingSuffix:
          "reviews still pending analysis.",
      },

      stopReasons: {
        sourceExhausted:
          "DataForSEO returned fewer reviews than the requested depth.",

        noNewReviews:
          "The latest batch contained no new reviews.",

        maxDepthReached:
          "The configured maximum depth limit was reached.",
      },
    },

    reviewsInbox: {
      eyebrow:
        "Received reviews",

      title:
        "Reviews inbox",

      description:
        "Select a review to analyze it and prepare a response.",

      loading:
        "Loading...",

      availableSuffix:
        "available",

      searchPlaceholder:
        "Search by guest, title, property, or content...",

      searchAria:
        "Search reviews",

      sourceFilterAria:
        "Filter by source",

      statusFilterAria:
        "Filter by status",

      allSources:
        "All sources",

      openStatuses:
        "Pending management",

      allStatuses:
        "All statuses",

      statuses: {
        new:
          "New",

        pending:
          "Pending",

        in_review:
          "In review",

        approved:
          "Approved",

        published:
          "Published",
      },

      statusesPlural: {
        new:
          "New",

        pending:
          "Pending",

        in_review:
          "In review",

        approved:
          "Approved",

        published:
          "Published",
      },

      empty:
        "No reviews match the selected filters.",

      guest:
        "Guest",

      priority:
        "Priority",

      untitled:
        "Untitled review",

      noText:
        "This review contains no text.",

      noDate:
        "No date",

      starsSuffix:
        "out of 5 stars",

      loadErrorPrefix:
        "The inbox could not be loaded:",
    },

    reviewDetail: {
      page: {
        back:
          "Back to Reviews",

        unavailable:
          "Review unavailable",

        notFound:
          "The requested review could not be found.",
      },

      reviewCard: {
        sourceAria:
          "Review source",

        loadingSources:
          "Loading sources...",

        selectSource:
          "Select a source",

        loading:
          "Loading...",

        starsSuffix:
          "out of 5 stars",

        statusAria:
          "Review status",

        statuses: {
          new:
            "New",

          inReview:
            "In review",

          approved:
            "Approved",

          published:
            "Published",
        },

        loadingGuest:
          "Loading guest...",

        loadingReview:
          "Loading review...",
      },

      context: {
        eyebrow:
          "Internal context",

        title:
          "What should the AI know before responding?",

        optional:
          "Optional",

        placeholder:
          "Example: The guest arrived three hours before check-in and the air conditioning was repaired that same afternoon.",

        stopRecording:
          "Stop recording",

        explainByVoice:
          "Explain by voice",

        recording:
          "Recording demonstration…",

        audioFuture:
          "The audio feature will be connected in the next stage.",
      },

      responseEditor: {
        eyebrow:
          "Generated draft",

        title:
          "Proposed response",

        toneAria:
          "Response tone",

        tones: {
          professional:
            "Professional",

          warm:
            "Warm",

          brief:
            "Brief",
        },

        translationLanguageAria:
          "Translation language",

        languages: {
          es:
            "Spanish",

          en:
            "English",

          fr:
            "French",

          de:
            "German",

          it:
            "Italian",

          pt:
            "Portuguese",

          ru:
            "Russian",

          zh:
            "Simplified Chinese",

          vi:
            "Vietnamese",
        },

        placeholder:
          "Click Generate response to create an AI draft.",

        generating:
          "Generating...",

        regenerate:
          "Regenerate response",

        generate:
          "Generate response",

        translating:
          "Translating...",

        translate:
          "Translate",

        restoreOriginal:
          "Restore original",

        copyAndOpen:
          "Copy and open source",

        saving:
          "Saving...",

        saveDraft:
          "Save draft",

        noApprovalPermission:
          "Your role does not have permission to approve responses.",

        approving:
          "Approving...",

        approve:
          "Approve response",

        savedPrefix:
          "Draft saved for source",
      },

      analysis: {
        eyebrow:
          "Automatic analysis",

        title:
          "Review summary",

        analyzingReview:
          "Analyzing review...",

        source:
          "Source",

        loading:
          "Loading...",

        noSource:
          "None selected",

        sentiment:
          "Sentiment",

        analyzing:
          "Analyzing...",

        priority:
          "Priority",

        emotion:
          "Emotion",

        recommendationProbability:
          "Recommendation probability",

        detectedAreas:
          "Detected areas",

        noResults:
          "No results",

        positiveAspects:
          "Positive aspects",

        negativeAspects:
          "Negative aspects",

        executiveSummary:
          "Executive summary",

        values: {
          sentiment: {
            very_positive: "Very positive",
            positive: "Positive",
            neutral: "Neutral",
            moderately_negative: "Moderately negative",
            very_negative: "Very negative",
          },

          priority: {
            low: "Low",
            medium: "Medium",
            high: "High",
            critical: "Critical",
          },

          emotion: {
            satisfaction: "Satisfaction",
            gratitude: "Gratitude",
            enthusiasm: "Enthusiasm",
            neutral: "Neutral",
            disappointment: "Disappointment",
            frustration: "Frustration",
            anger: "Anger",
            concern: "Concern",
          },

          recommendationProbability: {
            very_low: "Very low",
            low: "Low",
            medium: "Medium",
            high: "High",
            very_high: "Very high",
          },

          areas: {
            cleanliness: "Cleanliness",
            staff_service: "Staff service",
            room: "Room",
            bathroom: "Bathroom",
            food_beverage: "Food & beverage",
            breakfast: "Breakfast",
            location: "Location",
            facilities: "Facilities",
            maintenance: "Maintenance",
            comfort: "Comfort",
            noise: "Noise",
            wifi: "Wi-Fi",
            pool: "Pool",
            beach: "Beach",
            value: "Value for money",
            check_in: "Check-in",
            check_out: "Check-out",
            booking: "Booking",
            accessibility: "Accessibility",
            security: "Security",
            other: "Other",
          },
        },
      },

      workflow: {
        eyebrow:
          "Workflow",

        title:
          "Management status",

        steps: {
          captured:
            "Review captured",

          analyzed:
            "Analysis completed",

          responseReview:
            "Response under review",

          approval:
            "Approval",

          manualPublication:
            "Manual publication",
        },
      },

      workspace: {
        guest:
          "Guest",

        unspecifiedProperty:
          "Property not specified",

        noTextToAnalyze:
          "The review contains no text to analyze.",

        analysisFailed:
          "The review could not be analyzed.",

        invalidReviewId:
          "The review identifier is invalid.",

        sourcesLoadFailed:
          "The sources could not be loaded:",

        reviewNotFound:
          "The review could not be found.",

        invalidReviewText:
          "The selected review does not contain valid text.",

        responseGenerationFailed:
          "The response could not be generated.",

        emptyResponse:
          "The response cannot be empty.",

        translationFailed:
          "The response could not be translated.",

        responseRequired:
          "You must generate or write a response first.",

        sourceUrlMissing:
          "This review does not have a source URL.",

        copyOpenFailed:
          "The response could not be copied or the review could not be opened.",

        saveDraftFailed:
          "The draft could not be saved:",

        approvalFailed:
          "The response could not be approved.",
      },
    },
  },
} as const;

export type Messages =
  typeof messages.es;