using GestionCourrier.DTOs;
using GestionCourrier.Models;
using GestionCourrier.Workflows;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WorkflowCore.Interface;

namespace GestionCourrier.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsDossiersJuridiquesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWorkflowHost _workflowHost;

        public TransactionsDossiersJuridiquesController(ApplicationDbContext context, IWorkflowHost workflowHost)
        {
            _context = context;
            _workflowHost = workflowHost;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? entiteDJId, [FromQuery] string? statut)
        {
            var query = BaseQuery();

            if (entiteDJId.HasValue)
                query = query.Where(t => t.EntiteDJId == entiteDJId.Value);

            if (!string.IsNullOrWhiteSpace(statut))
                query = query.Where(t => t.Statut == statut.Trim());

            var transactions = await query
                .OrderByDescending(t => t.DateDemande)
                .ThenBy(t => t.Ordre)
                .ToListAsync();

            return Ok(transactions.Select(ToDto));
        }

        [HttpGet("dossier/{entiteDJId:int}")]
        public async Task<IActionResult> GetByDossier(int entiteDJId)
        {
            var exists = await _context.EntitesDJs.AnyAsync(e => e.Id == entiteDJId);
            if (!exists) return NotFound("Dossier juridique introuvable.");

            var transactions = await BaseQuery()
                .Where(t => t.EntiteDJId == entiteDJId)
                .OrderByDescending(t => t.DateDemande)
                .ThenBy(t => t.Ordre)
                .ToListAsync();

            return Ok(transactions.Select(ToDto));
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateTransactionDossierJuridiqueDto request)
        {
            if (request.EntiteDJId <= 0)
                return BadRequest("Dossier juridique obligatoire.");

            var destinations = request.DestinationServiceIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (destinations.Count == 0)
                return BadRequest("Selectionnez au moins un service destination.");

            var dossier = await _context.EntitesDJs
                .Include(e => e.NumeroDossier)
                .FirstOrDefaultAsync(e => e.Id == request.EntiteDJId);

            if (dossier == null)
                return NotFound("Dossier juridique introuvable.");

            if (!dossier.EstTransmissible)
                return BadRequest("Ce dossier juridique n'est pas transmissible.");

            var existingServiceIds = await _context.Services
                .Where(s => destinations.Contains(s.IdService))
                .Select(s => s.IdService)
                .ToListAsync();

            var missingServices = destinations.Except(existingServiceIds).ToList();
            if (missingServices.Count > 0)
                return BadRequest($"Service destination introuvable: {string.Join(", ", missingServices)}.");

            var sourceServiceId = dossier.IdService;
            var transactions = new List<TransactionDossierJuridique>();

            for (var i = 0; i < destinations.Count; i++)
            {
                var destinationServiceId = destinations[i];
                if (sourceServiceId == destinationServiceId)
                    return BadRequest("Le service source et le service destination doivent etre differents.");

                transactions.Add(new TransactionDossierJuridique
                {
                    EntiteDJId = dossier.Id,
                    IdServiceSource = sourceServiceId,
                    IdServiceDestination = destinationServiceId,
                    Ordre = i + 1,
                    Statut = TransactionDossierJuridiqueStatuts.EnAttente,
                    Commentaire = request.Commentaire?.Trim(),
                    DemandePar = ResolveDemandeur(request.DemandePar),
                    DateDemande = DateTime.UtcNow
                });

                sourceServiceId = destinationServiceId;
            }

            _context.TransactionsDossiersJuridiques.AddRange(transactions);
            await _context.SaveChangesAsync();

            var workflowId = await _workflowHost.StartWorkflow(
                "dossier-juridique-transaction",
                1,
                new DossierJuridiqueTransactionData
                {
                    TransactionIds = transactions.Select(t => t.IdTransaction).ToList()
                });

            foreach (var transaction in transactions)
                transaction.WorkflowInstanceId = workflowId;

            await _context.SaveChangesAsync();

            var ids = transactions.Select(t => t.IdTransaction).ToList();
            var created = await BaseQuery()
                .Where(t => ids.Contains(t.IdTransaction))
                .OrderBy(t => t.Ordre)
                .ToListAsync();

            return CreatedAtAction(nameof(GetByDossier), new { entiteDJId = dossier.Id }, created.Select(ToDto));
        }

        private IQueryable<TransactionDossierJuridique> BaseQuery()
        {
            return _context.TransactionsDossiersJuridiques
                .Include(t => t.EntiteDJ)
                    .ThenInclude(e => e!.NumeroDossier)
                .Include(t => t.ServiceSource)
                .Include(t => t.ServiceDestination);
        }

        private string ResolveDemandeur(string? demandePar)
        {
            if (!string.IsNullOrWhiteSpace(demandePar))
                return demandePar.Trim();

            return User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name ?? "Utilisateur";
        }

        private static TransactionDossierJuridiqueDto ToDto(TransactionDossierJuridique t)
        {
            return new TransactionDossierJuridiqueDto
            {
                IdTransaction = t.IdTransaction,
                EntiteDJId = t.EntiteDJId,
                NumeroDossier = FormatNumeroDossier(t.EntiteDJ),
                Sujet = t.EntiteDJ?.Sujet,
                IdServiceSource = t.IdServiceSource,
                ServiceSourceNom = t.ServiceSource?.NomService,
                IdServiceDestination = t.IdServiceDestination,
                ServiceDestinationNom = t.ServiceDestination?.NomService,
                Ordre = t.Ordre,
                Statut = t.Statut,
                Commentaire = t.Commentaire,
                DemandePar = t.DemandePar,
                WorkflowInstanceId = t.WorkflowInstanceId,
                DateDemande = t.DateDemande,
                DateTraitement = t.DateTraitement
            };
        }

        private static string? FormatNumeroDossier(EntiteDJ? dossier)
        {
            return dossier?.NumeroDossier == null
                ? null
                : $"{dossier.NumeroDossier.Annee}/{dossier.NumeroDossier.Nombre}/{dossier.NumeroDossier.NumeroSujet}";
        }
    }
}
