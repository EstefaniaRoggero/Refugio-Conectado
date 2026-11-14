-- Calendario de turnos de voluntariado (franjas horarias por refugio)
USE refugio_conectado;

CREATE TABLE IF NOT EXISTS voluntario_turnos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_voluntario INT NOT NULL,
  id_refugio INT NOT NULL,
  dia_semana TINYINT NOT NULL COMMENT '1=Lunes … 7=Domingo',
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  notas VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_voluntario) REFERENCES voluntarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_refugio) REFERENCES refugios(id_refugio) ON DELETE CASCADE,
  INDEX idx_turno_refugio_dia (id_refugio, dia_semana),
  INDEX idx_turno_voluntario (id_voluntario)
);
