using GestionCourrier.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace GestionCourrier.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("outgoing")]
        public async Task<IActionResult> GetOutgoing()
        {
            var serviceId = GetCurrentServiceId();

            var courriersAdministratifs = await _context.Entites
                .Include(e => e.Service)
                .Where(e => !e.EstArchive &&
                    e.TypeDocument == "Administratif" &&
                    (e.Direction == "Sortant" || e.Direction == "Interne") &&
                    (!serviceId.HasValue || e.IdService == serviceId.Value))
                .OrderByDescending(e => e.DateCreation)
                .Select(e => new
                {
                    id = e.IdEntite,
                    type = "Administratif",
                    numero = e.IdBureauOrdre,
                    sujet = e.Sujet,
                    destinataire = e.Destinataire,
                    serviceNom = e.Service != null ? e.Service.NomService : null,
                    statut = e.Etat,
                    dateEnvoi = e.DateCreation,
                    lienPdf = e.LienPdf
                })
                .ToListAsync();

            var dossiersJuridiques = await _context.EntitesDJs
                .Include(e => e.Service)
                .Include(e => e.NumeroDossier)
                .Where(e => !e.EstArchive &&
                    e.Direction == "Sortant" &&
                    (!serviceId.HasValue || e.IdService == serviceId.Value))
                .OrderByDescending(e => e.DateArchivage)
                .Select(e => new
                {
                    id = e.Id,
                    type = "Juridique",
                    numero = e.NumeroDossier != null
                        ? e.NumeroDossier.Annee + "/" + e.NumeroDossier.Nombre + "/" + e.NumeroDossier.NumeroSujet
                        : e.IdBureauOrdre,
                    sujet = e.Sujet,
                    destinataire = e.Destinataire,
                    serviceNom = e.Service != null ? e.Service.NomService : null,
                    statut = e.EtatArchive,
                    dateEnvoi = e.DateArchivage,
                    lienPdf = e.LienPdf
                })
                .ToListAsync();

            return Ok(courriersAdministratifs
                .Concat(dossiersJuridiques)
                .OrderByDescending(t => t.dateEnvoi));
        }

        private int? GetCurrentServiceId()
        {
            var value = User.FindFirstValue("IdService");
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
