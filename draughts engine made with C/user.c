/***********************************************************************
* Adaptive Simulated Annealing (ASA)
* Lester Ingber <ingber@alumni.caltech.edu>
* Copyright (c) 1993, 1994, 1995.  All Rights Reserved.
* The LICENSE file must be included with ASA code.
***********************************************************************/

#define USER_ID \
"/* $Id: user.c,v 9.4 1995/09/03 14:16:12 ingber Exp ingber $ */"

#include "user.h"

#if COST_FILE
#include "user_cst.h"
#endif

#if ASA_TEMPLATE_SAVE		/* used to illustrate use of ASA_SAVE */
static double random_array[256];
#endif

#if SELF_OPTIMIZE
#else

/***********************************************************************
* main
*	This is a sample calling program to optimize using ASA
***********************************************************************/
#if HAVE_ANSI
#if ASA_LIB
void
asa_main ()
#else
int
main (int argc, char **argv)
#endif
#else
#if ASA_LIB
void
asa_main ()
#else
int
main (argc, argv)
int argc;
char **argv;
#endif
#endif
{
    int *exit_code;
    ALLOC_INT n_param;
#if ASA_LIB
#else
int compile_cnt;
#endif
#if ASA_TEMPLATE_SAMPLE
    FILE *ptr_asa;
#endif
#if ASA_TEMPLATE_ASA_OUT_PID
    char pid_file[15];
    int pid_int;
#endif

    /* pointer to array storage for asa arguments */
    double *parameter_lower_bound, *parameter_upper_bound, *cost_parameters,
    *cost_tangents, *cost_curvature;
    double cost_value;

    /* the number of parameters to optimize */
    ALLOC_INT *parameter_dimension;

    /* pointer to array storage for parameter type flags */
    int *parameter_int_real;

    /* valid flag for cost function */
    int *cost_flag;

    /* seed for random number generator */
    static LONG_INT *rand_seed;

    USER_DEFINES *USER_OPTIONS;

#if OPTIONS_FILE
    FILE *ptr_options;
    char read_option[80];
    int read_int;
#if INT_LONG
    LONG_INT read_long;
#endif
    double read_double;
#endif

#if ASA_TEMPLATE_MULTIPLE
    int n_asa, n_trajectory;
    ALLOC_INT index;
#if HAVE_ANSI
    char asa_file[8] = "asa_x_y";
#else
char asa_file[8];
asa_file[0] = asa_file[2] = 'a';
asa_file[1] = 's';
asa_file[3] = asa_file[5] = '_';
asa_file[4] = 'x';
asa_file[6] = 'y';
asa_file[7] = '\0';
#endif /* HAVE_ANSI */
#endif /* ASA_TEMPLATE_MULTIPLE */

#if ASA_TEMPLATE_ASA_OUT_PID
    pid_file[0] = 'u';
    pid_file[1] = 's';
    pid_file[2] = 'e';
    pid_file[3] = 'r';
    pid_file[4] = '_';
    pid_file[5] = 'o';
    pid_file[6] = 'u';
    pid_file[7] = 't';
    pid_file[8] = '_';
    pid_file[14] = '\0';

    pid_int = getpid ();
    if (pid_int < 0)
    {
        pid_int = -pid_int;
    }

    if (pid_int > 99999)
    {
        pid_file[8] = '1';
        pid_int = pid_int % 100000;
    }

    if (pid_int < 10 && pid_int > 0)
    {
        pid_file[9] = '0';
        pid_file[10] = '0';
        pid_file[11] = '0';
        pid_file[12] = '0';
        pid_file[13] = '0' + pid_int;
    }
    else if (pid_int >= 10 && pid_int < 100)
    {
        pid_file[9] = '0';
        pid_file[10] = '0';
        pid_file[11] = '0';
        pid_file[12] = '0' + (int) (pid_int / 10);
        pid_file[13] = '0' + (pid_int % 10);
    }
    else if (pid_int >= 100 && pid_int < 1000)
    {
        pid_file[9] = '0';
        pid_file[10] = '0';
        pid_file[11] = '0' + (int) (pid_int / 100);
        pid_file[12] = '0' + (int) ((pid_int % 100) / 10);
        pid_file[13] = '0' + ((pid_int % 100) % 10);
    }
    else if (pid_int >= 1000 && pid_int < 10000)
    {
        pid_file[9] = '0';
        pid_file[10] = '0' + (int) (pid_int / 1000);
        pid_file[11] = '0' + (int) ((pid_int % 1000) / 100);
        pid_file[12] = '0' + (int) (((pid_int % 1000) % 100) / 10);
        pid_file[13] = '0' + (((pid_int % 1000) % 100) % 10);
    }
    else if (pid_int >= 10000 && pid_int <= 99999)
    {
        pid_file[9] = '0' + (int) (pid_int / 10000);
        pid_file[10] = '0' + (int) ((pid_int % 10000) / 1000);
        pid_file[11] = '0' + (int) (((pid_int % 10000) % 1000) / 100);
        pid_file[12] = '0' + (int) (((pid_int % 10000) % 1000) % 100 / 10);
        pid_file[13] = '0' + ((((pid_int % 10000) % 1000) % 100) % 10);
    }
    else
    {
        pid_file[8] = '0';
        pid_file[9] = '0';
        pid_file[10] = '0';
        pid_file[11] = '0';
        pid_file[12] = '0';
        pid_file[13] = '0';
    }
    ptr_out = fopen (pid_file, "w");
#else /* ASA_TEMPLATE_ASA_OUT_PID */

/* open the output file */
#if ASA_SAVE
ptr_out = fopen ("user_out", "a");
#else
ptr_out = fopen ("user_out", "w");
#endif

#endif /* ASA_TEMPLATE_ASA_OUT_PID */

    /* use this instead if you want output to stdout */
#if FALSE
    ptr_out = stdout;
#endif
    fprintf (ptr_out, "%s\n\n", USER_ID);

#if ASA_LIB
#else
/* print out compile options set by user in Makefile */
if (argc > 1)
{
    fprintf (ptr_out, "CC = %s\n", argv[1]);
    for (compile_cnt = 2; compile_cnt < argc; ++compile_cnt)
    {
        fprintf (ptr_out, "\t%s\n", argv[compile_cnt]);
    }
    fprintf (ptr_out, "\n");
}
#endif
#if TIME_CALC
    /* print starting time */
    print_time ("start", ptr_out);
#endif
    fflush (ptr_out);

    if ((rand_seed =
                (LONG_INT *) calloc (1, sizeof (LONG_INT))) == NULL)
        exit (9);

    /* first value of *rand_seed */
    *rand_seed = 696969;
    /* initialize random number generator with first call */
    randflt (rand_seed);

    /* Initialize the users parameters, allocating space, etc.
    Note that the default is to have asa generate the initial
    cost_parameters that satisfy the user's constraints. */

    if ((parameter_dimension =
                (ALLOC_INT *) calloc (1, sizeof (ALLOC_INT))) == NULL)
        exit (9);
    if ((exit_code = (int *) calloc (1, sizeof (int))) == NULL)
        exit (9);
    if ((cost_flag = (int *) calloc (1, sizeof (int))) == NULL)
        exit (9);

    if ((USER_OPTIONS =
                (USER_DEFINES *) calloc (1, sizeof (USER_DEFINES))) == NULL)
        exit (9);

#if OPTIONS_FILE
    /* Test to see if asa_opt is in correct directory.
    This is useful for some PC and Mac compilers. */
    if ((ptr_options = fopen ("asa_opt", "r")) == NULL)
        exit (6);

#if INT_LONG
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%ld", &read_long);
    USER_OPTIONS->Limit_Acceptances = read_long;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%ld", &read_long);
    USER_OPTIONS->Limit_Generated = read_long;
#else
fscanf (ptr_options, "%s", read_option);
fscanf (ptr_options, "%d", &read_int);
USER_OPTIONS->Limit_Acceptances = read_int;
fscanf (ptr_options, "%s", read_option);
fscanf (ptr_options, "%d", &read_int);
USER_OPTIONS->Limit_Generated = read_int;
#endif
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Limit_Invalid_Generated_States = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Accepted_To_Generated_Ratio = read_double;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Cost_Precision = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Maximum_Cost_Repeat = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Number_Cost_Samples = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Temperature_Ratio_Scale = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Cost_Parameter_Scale_Ratio = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Temperature_Anneal_Scale = read_double;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Include_Integer_Parameters = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->User_Initial_Parameters = read_int;
#if INT_ALLOC
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Sequential_Parameters = read_int;
#else
#if INT_LONG
fscanf (ptr_options, "%s", read_option);
fscanf (ptr_options, "%ld", &read_long);
USER_OPTIONS->Sequential_Parameters = read_long;
#else
fscanf (ptr_options, "%s", read_option);
fscanf (ptr_options, "%d", &read_int);
USER_OPTIONS->Sequential_Parameters = read_int;
#endif
#endif
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Initial_Parameter_Temperature = read_double;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Acceptance_Frequency_Modulus = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Generated_Frequency_Modulus = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Reanneal_Cost = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Reanneal_Parameters = read_int;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Delta_X = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->User_Tangents = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Curvature_0 = read_int;

#else /* OPTIONS_FILE */
/* USER_OPTIONS->Limit_Acceptances = 10000; */
USER_OPTIONS->Limit_Acceptances = 1000;
USER_OPTIONS->Limit_Generated = 99999;
USER_OPTIONS->Limit_Invalid_Generated_States = 1000;
/* USER_OPTIONS->Accepted_To_Generated_Ratio = 1.0E-6; */
USER_OPTIONS->Accepted_To_Generated_Ratio = 1.0E-4;

USER_OPTIONS->Cost_Precision = 1.0E-18;
USER_OPTIONS->Maximum_Cost_Repeat = 5;
USER_OPTIONS->Number_Cost_Samples = 5;
USER_OPTIONS->Temperature_Ratio_Scale = 1.0E-5;
USER_OPTIONS->Cost_Parameter_Scale_Ratio = 1.0;
USER_OPTIONS->Temperature_Anneal_Scale = 100.0;

USER_OPTIONS->Include_Integer_Parameters = FALSE;
USER_OPTIONS->User_Initial_Parameters = FALSE;
USER_OPTIONS->Sequential_Parameters = -1;
USER_OPTIONS->Initial_Parameter_Temperature = 1.0;

USER_OPTIONS->Acceptance_Frequency_Modulus = 100;
USER_OPTIONS->Generated_Frequency_Modulus = 10000;
USER_OPTIONS->Reanneal_Cost = TRUE;
USER_OPTIONS->Reanneal_Parameters = TRUE;

USER_OPTIONS->Delta_X = 0.001;
USER_OPTIONS->User_Tangents = FALSE;
USER_OPTIONS->Curvature_0 = FALSE;

#endif /* OPTIONS_FILE */

    /* ALLOCATE STORAGE */

#if ASA_TEMPLATE_SAVE
    /* Such data could be saved in a user_save file, but for
    convenience here everything is saved in asa_save. */
    USER_OPTIONS->Asa_Data_Dim = 256;
    if ((USER_OPTIONS->Asa_Data =
                (double *) calloc (256, sizeof (double))) == NULL)
        exit (9);
    USER_OPTIONS->Asa_Data = random_array;
#endif

#if USER_ASA_OUT
    if ((USER_OPTIONS->Asa_Out_File =
                (char *) calloc (80, sizeof (char))
        ) == NULL)
        exit (9);
#endif

    /* the number of parameters for the cost function */
#if OPTIONS_FILE_DATA
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%s", read_option);

#if INT_ALLOC
    fscanf (ptr_options, "%d", &read_int);
    *parameter_dimension = read_int;
#else
#if INT_LONG
fscanf (ptr_options, "%ld", &read_long);
*parameter_dimension = read_long;
#else
fscanf (ptr_options, "%d", &read_int);
*parameter_dimension = read_int;
#endif
#endif

#else /* OPTIONS_FILE_DATA */
#if ASA_TEST
*parameter_dimension = 4;
/* end ASA_TEST */
#else /* MY_COST */
/* If not using OPTIONS_FILE_DATA, here
insert the number of parameters for the cost_function */
#endif /* MY_COST */
#endif /* OPTIONS_FILE_DATA */

#if ASA_TEMPLATE_SAMPLE
    *parameter_dimension = 2;
    USER_OPTIONS->Limit_Acceptances = 2000;
    USER_OPTIONS->User_Tangents = TRUE;
    USER_OPTIONS->Limit_Weights = 1.0E-7;
#endif
#if ASA_TEMPLATE_PARALLEL
    USER_OPTIONS->Gener_Block = 100;
    USER_OPTIONS->Gener_Block_Max = 512;
    USER_OPTIONS->Gener_Mov_Avr = 3;
#endif

    /* allocate parameter minimum space */
    if ((parameter_lower_bound =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    /* allocate parameter maximum space */
    if ((parameter_upper_bound =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    /* allocate parameter initial values; the parameter final values
    will be stored here later */
    if ((cost_parameters =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    /* allocate the parameter types, real or integer */
    if ((parameter_int_real =
                (int *) calloc (*parameter_dimension, sizeof (int))
        ) == NULL)
        exit (9);
    /* allocate space for parameter cost_tangents -
    used for reannealing */
    if ((cost_tangents =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);

    if (USER_OPTIONS->Curvature_0 == FALSE || USER_OPTIONS->Curvature_0 == -1)
    {
        /* allocate space for parameter cost_curvatures/covariance */
        if ((cost_curvature =
                    (double *) calloc ((*parameter_dimension) *
                                       (*parameter_dimension),
                                       sizeof (double))) == NULL)
            exit (9);
    }
    else
    {
        cost_curvature = (double *) NULL;
    }

#if USER_COST_SCHEDULE
    USER_OPTIONS->Cost_Schedule = user_cost_schedule;
#endif
#if USER_ACCEPTANCE_TEST
    USER_OPTIONS->Acceptance_Test = user_acceptance_test;
#endif
#if USER_GENERATING_FUNCTION
    USER_OPTIONS->Generating_Distrib = user_generating_distrib;
#endif
#if USER_REANNEAL_COST
    USER_OPTIONS->Reanneal_Cost_Function = user_reanneal_cost;
#endif
#if USER_REANNEAL_PARAMETERS
    USER_OPTIONS->Reanneal_Params_Function = user_reanneal_params;
#endif

    initialize_parameters (cost_parameters,
                           parameter_lower_bound,
                           parameter_upper_bound,
                           cost_tangents,
                           cost_curvature,
                           parameter_dimension,
                           parameter_int_real,
#if OPTIONS_FILE_DATA
                           ptr_options,
#endif
                           USER_OPTIONS);
#if OPTIONS_FILE
    fclose (ptr_options);
#endif

    /* optimize the cost_function, returning the results in
    cost_value and cost_parameters */
#if ASA_TEMPLATE_MULTIPLE
    /* multiple asa() quenched calls + multiple asa_out files
    (To get longer quenched runs, decrease SMALL_FLOAT.) */
    for (n_asa = 1; n_asa <= *parameter_dimension; n_asa++)
    {
        asa_file[4] = 'A' + n_asa - 1;
        USER_OPTIONS->User_Quench_Cost_Scale[0] = (double) n_asa;
        for (index = 0; index < *parameter_dimension; ++index)
            USER_OPTIONS->User_Quench_Param_Scale[index] =
                (double) n_asa;
        for (n_trajectory = 0; n_trajectory < 3; ++n_trajectory)
        {
            asa_file[6] = 'a' + n_trajectory;
            strcpy (USER_OPTIONS->Asa_Out_File, asa_file);
#endif

#if ASA_TEMPLATE_ASA_OUT_PID
            pid_file[0] = 'a';
            pid_file[1] = 's';
            pid_file[2] = 'a';
            pid_file[3] = '_';
            pid_file[4] = 'o';
            pid_file[5] = 'u';
            pid_file[6] = 't';
            pid_file[7] = '_';

            pid_int = getpid ();
            if (pid_int < 0)
            {
                pid_file[7] = '0';
                pid_int = -pid_int;
            }

            strcpy (USER_OPTIONS->Asa_Out_File, pid_file);
#endif

            cost_value =
                asa (cost_function,
                     randflt,
                     rand_seed,
                     cost_parameters,
                     parameter_lower_bound,
                     parameter_upper_bound,
                     cost_tangents,
                     cost_curvature,
                     parameter_dimension,
                     parameter_int_real,
                     cost_flag,
                     exit_code,
                     USER_OPTIONS);

            fprintf (ptr_out, "final cost value = %12.7g\n", cost_value);
            fprintf (ptr_out, "parameter\tvalue\n");
            for (n_param = 0; n_param < *parameter_dimension; ++n_param)
            {
                fprintf (ptr_out,
#if INT_ALLOC
                         "%d\t\t%12.7g\n",
#else
#if INT_LONG
"%ld\t\t%12.7g\n",
#else
"%d\t\t%12.7g\n",
#endif
#endif
                         n_param, cost_parameters[n_param]);
            }

#if TIME_CALC
            /* print ending time */
            print_time ("end", ptr_out);
#endif
#if ASA_TEMPLATE_MULTIPLE
        }
    }
#endif

#if ASA_TEMPLATE_SAMPLE
    ptr_asa = fopen ("asa_out", "r");
    sample (ptr_out, ptr_asa);
#endif

    /* close all files */
    fclose (ptr_out);
#if OPTIONAL_DATA
    free (USER_OPTIONS->Asa_Data);
#endif
#if OPTIONAL_DATA_INT
    free (USER_OPTIONS->Asa_Data_Int);
#endif
#if USER_ASA_OUT
    free (USER_OPTIONS->Asa_Out_File);
#endif
#if ASA_SAMPLE
    free (USER_OPTIONS->Bias_Generated);
#endif
    if (USER_OPTIONS->Curvature_0 == FALSE || USER_OPTIONS->Curvature_0 == -1)
        free (cost_curvature);
#if USER_INITIAL_PARAMETERS_TEMPS
    free (USER_OPTIONS->User_Parameter_Temperature);
#endif
#if USER_INITIAL_COST_TEMP
    free (USER_OPTIONS->User_Cost_Temperature);
#endif
#if DELTA_PARAMETERS
    free (USER_OPTIONS->User_Delta_Parameter);
#endif
#if QUENCH_PARAMETERS
    free (USER_OPTIONS->User_Quench_Param_Scale);
#endif
#if QUENCH_COST
    free (USER_OPTIONS->User_Quench_Cost_Scale);
#endif
#if RATIO_TEMPERATURE_SCALES
    free (USER_OPTIONS->User_Temperature_Ratio);
#endif
    free (USER_OPTIONS);
    free (parameter_dimension);
    free (exit_code);
    free (cost_flag);
    free (parameter_lower_bound);
    free (parameter_upper_bound);
    free (cost_parameters);
    free (parameter_int_real);
    free (cost_tangents);
    free (rand_seed);

#if ASA_LIB
#else
exit (0);
/* NOTREACHED */
#endif
}
#endif /* SELF_OPTIMIZE */

/***********************************************************************
* initialize_parameters - sample parameter initialization function
*	This depends on the users cost function to optimize (minimum).
*	The routine allocates storage needed for asa. The user should
*	define the number of parameters and their ranges,
*	and make sure the initial parameters are within
*	the minimum and maximum ranges. The array
*	parameter_int_real should be REAL_TYPE (-1) for real parameters,
*	and INTEGER_TYPE (1) for integer values
***********************************************************************/
#if HAVE_ANSI
void
initialize_parameters (double *cost_parameters,
                       double *parameter_lower_bound,
                       double *parameter_upper_bound,
                       double *cost_tangents,
                       double *cost_curvature,
                       ALLOC_INT * parameter_dimension,
                       int *parameter_int_real,
#if OPTIONS_FILE_DATA
                       FILE * ptr_options,
#endif
                       USER_DEFINES * USER_OPTIONS)
#else
void
initialize_parameters (cost_parameters,
                       parameter_lower_bound,
                       parameter_upper_bound,
                       cost_tangents,
                       cost_curvature,
                       parameter_dimension,
                       parameter_int_real,
#if OPTIONS_FILE_DATA
                       ptr_options,
#endif
                       USER_OPTIONS)
double *cost_parameters;
double *parameter_lower_bound;
double *parameter_upper_bound;
double *cost_tangents;
double *cost_curvature;
ALLOC_INT *parameter_dimension;
int *parameter_int_real;
#if OPTIONS_FILE_DATA
FILE *ptr_options;
#endif
USER_DEFINES *USER_OPTIONS;
#endif
{
    ALLOC_INT index;
#if OPTIONS_FILE_DATA
    char read_option[80];
    ALLOC_INT read_index;
#endif

#if OPTIONS_FILE_DATA
    fscanf (ptr_options, "%s", read_option);

    for (index = 0; index < *parameter_dimension; ++index)
    {
#if INT_ALLOC
        fscanf (ptr_options, "%d", &read_index);
#else
#if INT_LONG
        fscanf (ptr_options, "%ld", &read_index);
#else
        fscanf (ptr_options, "%d", &read_index);
#endif
#endif
        fscanf (ptr_options, "%lf%lf%lf%d",
                &(parameter_lower_bound[read_index]),
                &(parameter_upper_bound[read_index]),
                &(cost_parameters[read_index]),
                &(parameter_int_real[read_index]));
    }
#else /* OPTIONS_FILE_DATA */
#if ASA_TEST
    /* store the parameter ranges */
    for (index = 0; index < *parameter_dimension; ++index)
        parameter_lower_bound[index] = -10000.0;
    for (index = 0; index < *parameter_dimension; ++index)
        parameter_upper_bound[index] = 10000.0;

    /* store the initial parameter types */
    for (index = 0; index < *parameter_dimension; ++index)
        parameter_int_real[index] = REAL_TYPE;

    /* store the initial parameter values */
    for (index = 0; index < *parameter_dimension / 4.0; ++index)
    {
        cost_parameters[4 * (index + 1) - 4] = 999.0;
        cost_parameters[4 * (index + 1) - 3] = -1007.0;
        cost_parameters[4 * (index + 1) - 2] = 1001.0;
        cost_parameters[4 * (index + 1) - 1] = -903.0;
    }
    /* end ASA_TEST */
#else /* MY_COST */
    /* If not using OPTIONS_FILE_DATA, here
    store the parameter ranges
    store the parameter types
    store the initial parameter values */
#endif /* MY_COST */
#endif /* OPTIONS_FILE_DATA */

#if ASA_TEMPLATE_SAMPLE
    for (index = 0; index < *parameter_dimension; ++index)
        parameter_lower_bound[index] = 0;
    for (index = 0; index < *parameter_dimension; ++index)
        parameter_upper_bound[index] = 2.0;
    for (index = 0; index < *parameter_dimension; ++index)
        parameter_int_real[index] = REAL_TYPE;
    for (index = 0; index < *parameter_dimension; ++index)
        cost_parameters[index] = 0.5;
#endif

#if USER_INITIAL_PARAMETERS_TEMPS
    if ((USER_OPTIONS->User_Parameter_Temperature =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE
    for (index = 0; index < *parameter_dimension; ++index)
        USER_OPTIONS->User_Parameter_Temperature[index] = 1.0;
#endif
#endif /* USER_INITIAL_PARAMETERS_TEMPS */
#if USER_INITIAL_COST_TEMP
    if ((USER_OPTIONS->User_Cost_Temperature =
                (double *) calloc (1, sizeof (double))) == NULL)
        exit (9);
#if ASA_TEMPLATE
    USER_OPTIONS->User_Cost_Temperature[0] = 5.936648E+09;
#endif
#endif /* USER_INITIAL_COST_TEMP */
#if DELTA_PARAMETERS
    if ((USER_OPTIONS->User_Delta_Parameter =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE
    for (index = 0; index < *parameter_dimension; ++index)
        USER_OPTIONS->User_Delta_Parameter[index] = 0.001;
#endif
#endif /* DELTA_PARAMETERS */
#if QUENCH_PARAMETERS
    if ((USER_OPTIONS->User_Quench_Param_Scale =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE
    for (index = 0; index < *parameter_dimension; ++index)
        USER_OPTIONS->User_Quench_Param_Scale[index] = 1.0;
#endif
#if ASA_TEMPLATE_MULTIPLE
    for (index = 0; index < *parameter_dimension; ++index)
        USER_OPTIONS->User_Quench_Param_Scale[index] = 1.0;
#endif
#if ASA_TEMPLATE_SAVE
    for (index = 0; index < *parameter_dimension; ++index)
        USER_OPTIONS->User_Quench_Param_Scale[index] = 1.0;
#endif
#endif /* QUENCH_PARAMETERS */
#if QUENCH_COST
    if ((USER_OPTIONS->User_Quench_Cost_Scale =
                (double *) calloc (1, sizeof (double))) == NULL)
        exit (9);
#if ASA_TEMPLATE
    USER_OPTIONS->User_Quench_Cost_Scale[0] = 1.0;
#endif
#if ASA_TEMPLATE_MULTIPLE
    USER_OPTIONS->User_Quench_Cost_Scale[0] = 1.0;
#endif
#if ASA_TEMPLATE_SAVE
    USER_OPTIONS->User_Quench_Cost_Scale[0] = 1.0;
#endif
#endif /* QUENCH_COST */
#if RATIO_TEMPERATURE_SCALES
    if ((USER_OPTIONS->User_Temperature_Ratio =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE
    for (index = 0; index < *parameter_dimension; ++index)
        USER_OPTIONS->User_Temperature_Ratio[index] = 1.0;
#endif
#endif /* RATIO_TEMPERATURE_SCALES */
    /* Defines the limit of collection of sampled data by asa */
#if ASA_SAMPLE
    /* create memory for Bias_Generated[] */
    if ((USER_OPTIONS->Bias_Generated =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
#endif
}

#if COST_FILE
#else
/***********************************************************************
* double cost_function
*	This is the users cost function to optimize
*	(find the minimum).
*	cost_flag is set to TRUE if the parameter set
*	does not violates any constraints
*       parameter_lower_bound and parameter_upper_bound may be
*       adaptively changed during the search.
***********************************************************************/

#if HAVE_ANSI
double
cost_function (double *x,
               double *parameter_lower_bound,
               double *parameter_upper_bound,
               double *cost_tangents,
               double *cost_curvature,
               ALLOC_INT * parameter_dimension,
               int *parameter_int_real,
               int *cost_flag,
               int *exit_code,
               USER_DEFINES * USER_OPTIONS)
#else
double
cost_function (x,
               parameter_lower_bound,
               parameter_upper_bound,
               cost_tangents,
               cost_curvature,
               parameter_dimension,
               parameter_int_real,
               cost_flag,
               exit_code,
               USER_OPTIONS)
double *x;
double *parameter_lower_bound;
double *parameter_upper_bound;
double *cost_tangents;
double *cost_curvature;
ALLOC_INT *parameter_dimension;
int *parameter_int_real;
int *cost_flag;
int *exit_code;
USER_DEFINES *USER_OPTIONS;
#endif
{

#if ASA_TEST			/* ASA test problem */
    /* Objective function from
    * %A A. Corana
    * %A M. Marchesi
    * %A C. Martini
    * %A S. Ridella
    * %T Minimizing multimodal functions of continuous variables
    with the "simulated annealing" algorithm
    * %J ACM Trans. Mathl. Software
    * %V 13
    * %N 3
    * %P 262-279
    * %D 1987
    *
    * This function contains 1.0E20 local minima.  When *parameter_dimension
    * is equal to 4, visiting each minimum for a millisecond would take
    * about the present age of the universe to visit all these minima. */

    /* defines for the test problem, which assume *parameter_dimension
    is a multiple of 4.  If this is set to a large number, you
    likely should set Curvature_0 to TRUE. */
#define ARRAY_LIMIT	4	/* set equal to *parameter_dimension */
#define ARR_LMT4	(ARRAY_LIMIT/4)

    double d[ARRAY_LIMIT];
    double q_n, s_i, t_i, z_i, c_r;
    int k_i;
    LONG_INT i;
#if SELF_OPTIMIZE
#else
static LONG_INT funevals = 0;
#endif
#if ASA_TEMPLATE_SAVE
    static int read_test = 0;
    FILE *ptr_read_test;
#endif

    /* a_i = parameter_upper_bound[i] */
    s_i = 0.2;
    t_i = 0.05;
    c_r = 0.15;

    for (i = 0; i < ARR_LMT4; ++i)
    {
        d[4 * (i + 1) - 4] = 1.0;
        d[4 * (i + 1) - 3] = 1000.0;
        d[4 * (i + 1) - 2] = 10.0;
        d[4 * (i + 1) - 1] = 100.0;
    }

    q_n = 0.0;
    for (i = 0; i < ARRAY_LIMIT; ++i)
    {
        if (x[i] > 0.0)
        {
            k_i = (int) (x[i] / s_i + 0.5);
        }
        else if (x[i] < 0.0)
        {
            k_i = (int) (x[i] / s_i - 0.5);
        }
        else
        {
            k_i = 0;
        }

        if (fabs (k_i * s_i - x[i]) < t_i)
        {
            if (k_i < 0)
            {
                z_i = k_i * s_i + t_i;
            }
            else if (k_i > 0)
            {
                z_i = k_i * s_i - t_i;
            }
            else
            {
                z_i = 0.0;
            }
            q_n += c_r * d[i] * z_i * z_i;
        }
        else
        {
            q_n += d[i] * x[i] * x[i];
        }
    }
    funevals = funevals + 1;

#if ASA_TEMPLATE_SAVE
    /* cause a crash */
    if ((ptr_read_test = fopen ("asa_save", "r")) == NULL)
    {
        read_test = 1;
        fclose (ptr_read_test);
    }
    else
    {
        fclose (ptr_read_test);
    }
    /* will need a few hundred if testing ASA_PARALLEL to get an asa_save */
    if (funevals == 50 && read_test == 1)
    {
        exit (2);
    }
#endif

    *cost_flag = TRUE;

#if SELF_OPTIMIZE
#else
#if TIME_CALC
/* print the time every PRINT_FREQUENCY evaluations */
if ((PRINT_FREQUENCY > 0) && ((funevals % PRINT_FREQUENCY) == 0))
{
    fprintf (ptr_out, "funevals = %ld  ", funevals);
    print_time ("", ptr_out);
}
#endif
#endif

#if ASA_TEMPLATE_SAMPLE
    USER_OPTIONS->Cost_Acceptance_Flag = TRUE;
    if (USER_OPTIONS->User_Acceptance_Flag == FALSE && *cost_flag == TRUE)
        USER_OPTIONS->Acceptance_Test (q_n, *parameter_dimension, USER_OPTIONS);
#endif /* ASA_TEMPLATE_SAMPLE */

    return (q_n);
    /* end ASA_TEST */
#else /* MY_COST */
/* Use the parameter values x[] and define your cost_function.
The {} brackets around this function are already in place. */
#endif /* MY_COST */

#if ASA_TEMPLATE_SAMPLE

    int n;
    double cost;

    if (*cost_flag == FALSE)
    {
        for (n = 0; n < *parameter_dimension; ++n)
            cost_tangents[n] = 2.0 * x[n];
    }

    cost = 0.0;
    for (n = 0; n < *parameter_dimension; ++n)
    {
        cost += (x[n] * x[n]);
    }

    *cost_flag = TRUE;

    USER_OPTIONS->Cost_Acceptance_Flag = TRUE;
    if (USER_OPTIONS->User_Acceptance_Flag == FALSE && *cost_flag == TRUE)
        USER_OPTIONS->Acceptance_Test (cost, *parameter_dimension, USER_OPTIONS);

    return (cost);
#endif /* ASA_TEMPLATE_SAMPLE */

}
#endif /* COST_FILE */

/* Here is a good random number generator */

#define SHUFFLE 256		/* size of random array */
#define MULT ((LONG_INT) 25173)
#define MOD ((LONG_INT) 65536)
#define INCR ((LONG_INT) 13849)
#define FMOD ((double) 65536.0)


/***********************************************************************
* double myrand() - returns random number between 0 and 1
*	This routine returns the random number generator between 0 and 1
***********************************************************************/

#if HAVE_ANSI
double
myrand (LONG_INT * rand_seed)
#else
double
myrand (rand_seed)
LONG_INT *rand_seed;
#endif
/* returns random number in {0,1} */
{
    *rand_seed = (LONG_INT) ((MULT * (*rand_seed) + INCR) % MOD);
    return ((double) (*rand_seed) / FMOD);
}

/***********************************************************************
* double randflt()
***********************************************************************/

#if HAVE_ANSI
double
randflt (LONG_INT * rand_seed)
#else
double
randflt (rand_seed)
LONG_INT *rand_seed;
#endif
/* shuffles random numbers in random_array[SHUFFLE] array */
{

    /* This RNG is a modified algorithm of that presented in
       * %A K. Binder
       * %A D. Stauffer
       * %T A simple introduction to Monte Carlo simulations and some
       *    specialized topics
       * %B Applications of the Monte Carlo Method in statistical physics
       * %E K. Binder
       * %I Springer-Verlag
       * %C Berlin
       * %D 1985
       * %P 1-36
       * where it is stated that such algorithms have been found to be
       * quite satisfactory in many statistical physics applications. */

    double rranf;
    unsigned kranf;
    int n;
    static int initial_flag = 0;
#if ASA_TEMPLATE_SAVE
#else
    static double random_array[SHUFFLE];	/* random variables */
#endif

    if (initial_flag == 0)
    {
        for (n = 0; n < SHUFFLE; ++n)
            random_array[n] = myrand (rand_seed);
        initial_flag = 1;

        for (n = 0; n < 1000; ++n)	/* warm up random generator */
            rranf = randflt (rand_seed);

        return (rranf);
    }

    kranf = (unsigned) (myrand (rand_seed) * SHUFFLE) % SHUFFLE;
    rranf = *(random_array + kranf);
    *(random_array + kranf) = myrand (rand_seed);

    return (rranf);
}

#if USER_COST_SCHEDULE
#if HAVE_ANSI
double
user_cost_schedule (double test_temperature,
                    USER_DEFINES * USER_OPTIONS)
#else
double
user_cost_schedule (test_temperature,
                    USER_OPTIONS)
double test_temperature;
USER_DEFINES *USER_OPTIONS;
#endif /* HAVE_ANSI */
{
    double x;

#if ASA_TEMPLATE_SAMPLE
    x = F_POW (test_temperature, 0.15);
#endif
#if ASA_TEMPLATE
    x = test_temperature;
#endif

    return (x);
}
#endif /* USER_COST_SCHEDULE */

#if USER_ACCEPTANCE_TEST
#if HAVE_ANSI
void
user_acceptance_test (double current_cost,
                      ALLOC_INT * parameter_dimension,
                      USER_DEFINES * USER_OPTIONS)
#else
void
user_acceptance_test (current_cost,
                      parameter_dimension,
                      USER_OPTIONS)
double current_cost;
ALLOC_INT *parameter_dimension;
USER_DEFINES *USER_OPTIONS;
#endif /* HAVE_ANSI */
{
    double x, uniform_test;
#if ASA_TEMPLATE_SAMPLE
    double q, delta_cost, curr_cost_temp;
#endif
#if FALSE			/* set to TRUE to activate */
    /* Calculate the current ASA cost index.  This could be useful
       to define a new schedule for the cost temperature, beyond
       simple changes that can be made using USER_COST_SCHEDULE. */

    double k_temperature, quench, y;

#if QUENCH_COST
    quench = USER_OPTIONS->User_Quench_Cost_Scale[0];
#else
    quench = 1.0;
#endif /* QUENCH_COST */
    y = -F_LOG (USER_OPTIONS->Cost_Temp_Curr
                / USER_OPTIONS->Cost_Temp_Init) / USER_OPTIONS->Cost_Temp_Scale;

    k_temperature = F_POW (y, (double) *parameter_dimension / quench);
#endif

    uniform_test = randflt (USER_OPTIONS->Random_Seed);
    curr_cost_temp = USER_OPTIONS->Cost_Temp_Curr;

#if ASA_TEMPLATE
    curr_cost_temp =
        (USER_OPTIONS->Cost_Schedule (USER_OPTIONS->Cost_Temp_Curr,
                                      USER_OPTIONS)
         + EPS_DOUBLE);
#endif
#if ASA_TEMPLATE_SAMPLE
#if USER_COST_SCHEDULE
    curr_cost_temp =
        (USER_OPTIONS->Cost_Schedule (USER_OPTIONS->Cost_Temp_Curr,
                                      USER_OPTIONS)
         + EPS_DOUBLE);
#endif

    delta_cost = (current_cost - USER_OPTIONS->Last_Cost)
                 / (curr_cost_temp + EPS_DOUBLE);

    /* The following asymptotic approximation to the exponential
     * function, "Tsallis statistics," was proposed in
     * %A T.J.P. Penna
     * %T Traveling salesman problem and Tsallis statistics
     * %J Phys. Rev. E
     * %V 50
     * %N 6
     * %P R1-R3
     * %D 1994
     * While the use of the TSP for a test case is of dubious value (since
     * there are many special algorithms for this problem), the use of this
     * function is another example of how to control the rate of annealing
     * of the acceptance criteria.  E.g., if you require a more moderate
     * acceptance test, then negative q may be helpful. */

    q = 1.0;
    if (fabs (1.0 - q) < EPS_DOUBLE)
        x = MIN (1.0, (F_EXP (-delta_cost)));	/* Boltzmann test */
    else if ((1.0 - (1.0 - q) * delta_cost) < EPS_DOUBLE)
        x = MIN (1.0, (F_EXP (-delta_cost)));	/* Boltzmann test */
    else
        x = MIN (1.0, F_POW ((1.0 - (1.0 - q) * delta_cost), (1.0 / (1.0 - q))));

    USER_OPTIONS->Prob_Bias = x;
    if (x >= uniform_test)
        USER_OPTIONS->User_Acceptance_Flag = TRUE;
    else
        USER_OPTIONS->User_Acceptance_Flag = FALSE;

#endif /* ASA_TEMPLATE */
}
#endif /* USER_ACCEPTANCE_TEST */

#if USER_GENERATING_FUNCTION
#if HAVE_ANSI
double
user_generating_distrib (LONG_INT * seed,
                         ALLOC_INT * parameter_dimension,
                         ALLOC_INT index_v,
                         double temperature_v,
                         double init_param_temp_v,
                         double temp_scale_params_v,
                         double parameter_v,
                         double parameter_range_v,
                         USER_DEFINES * USER_OPTIONS)
#else
double
user_generating_distrib (seed,
                         parameter_dimension,
                         index_v,
                         temperature_v,
                         init_param_temp_v,
                         temp_scale_params_v,
                         parameter_v,
                         parameter_range_v,
                         USER_OPTIONS)
LONG_INT *seed;
ALLOC_INT *parameter_dimension;
ALLOC_INT index_v;
double temperature_v;
double init_param_temp_v;
double temp_scale_params_v;
double parameter_v;
double parameter_range_v;
USER_DEFINES *USER_OPTIONS;
#endif
{
    double x, y, z;
#if FALSE			/* set to TRUE to activate */
    /* Calculate the current ASA temperature index for parameter_v.
       This could be useful, e.g., to define a slower polynomial
       or logarithmic schedule, as would be required by Cauchy
       or Gaussian distributions, respectively.  These distributions
       are defined below. */

    double k_temperature_v, temperature_0_v, quench_v;
    static double PI = 3.14159265358979323846;

#if QUENCH_PARAMETERS
    quench_v = USER_OPTIONS->User_Quench_Param_Scale[index_v];
#else
    quench = 1.0;
#endif /* QUENCH_PARAMETERS */
    y = -F_LOG (temperature_v / init_param_temp_v) / temp_scale_params_v;

    k_temperature_v = F_POW (y, (double) *parameter_dimension / quench_v);
#endif

#if ASA_TEMPLATE
    /* This is the ASA distribution.  A slower temperature schedule can be
       obtained here, e.g., temperature_v = pow(temperature_v, 0.5); */

    x = randflt (seed);
    y = x < 0.5 ? -1.0 : 1.0;
    z = y * temperature_v * (F_POW ((1.0 + 1.0 / temperature_v),
                                    fabs (2.0 * x - 1.0)) - 1.0);

    x = parameter_v + z * parameter_range_v;
#endif /* ASA_TEMPLATE */

#if FALSE			/* Cauchy Distribution */
    /* Note that this is a one-dimensional Cauchy distribution, which
       may not be optimal for problems in more than one dimension. */

    for (;;)
    {
        x = 2.0 * myrand (seed) - 1.0;
        y = 2.0 * myrand (seed) - 1.0;
        z = x * x + y * y;
        if (z <= 1.0)
            break;
    }
    if (fabs (x) < EPS_DOUBLE)
        x = (x < 0.0 ? x - EPS_DOUBLE : x + EPS_DOUBLE);

    z = (y / x);

    temperature_0_v = parameter_range_v;
    y = temperature_0_v / k_temperature_v;

    x = parameter_v + y * z;

    return (x);
#endif /* Cauchy Distribution */

#if FALSE			/* Gaussian Distribution */
    /* Note that this is a one-dimensional Gaussian distribution, which
       may not be optimal for problems in more than one dimension. */

    x = randflt (seed);
    y = randflt (seed);

    if (x < EPS_DOUBLE)
        x += EPS_DOUBLE;
    z = sqrt (-2.0 * F_LOG (x)) * sin (2.0 * PI * y);

    temperature_0_v = parameter_range_v;
    y = temperature_0_v / F_LOG (k_temperature_v);

    x = parameter_v + y * z;

    return (x);
#endif /* Gaussian Distribution */

    return (x);
}
#endif /* USER_GENERATING_FUNCTION */

#if USER_REANNEAL_COST
#if HAVE_ANSI
int
user_reanneal_cost (double *cost_best, double *cost_last,
                    double *initial_cost_temperature, USER_DEFINES * USER_OPTIONS)
#else
int
user_reanneal_cost (cost_best, cost_last,
                    initial_cost_temperature, USER_OPTIONS)
double *cost_best;
double *cost_last;
double *initial_cost_temperature;
USER_DEFINES *USER_OPTIONS;
#endif /* HAVE_ANSI */
{
    int cost_test;
#if ASA_TEMPLATE
    double tmp_dbl;
#if TRUE			/* set this to TRUE to try this template */
    static int first_time = 1;
    static double save_last[3];
    double average_cost_last;

    if (first_time == 1)
    {
        first_time = 0;
        save_last[0] = save_last[1] = save_last[2] = *cost_last;
    }

    save_last[2] = save_last[1];
    save_last[1] = save_last[0];
    save_last[0] = *cost_last;
    average_cost_last = fabs ((save_last[0] + save_last[1] + save_last[2]) / 3.0);

    tmp_dbl = MAX (fabs (*cost_best), average_cost_last);
    tmp_dbl = MAX ((double) EPS_DOUBLE, tmp_dbl);
    *initial_cost_temperature = MIN (*initial_cost_temperature, tmp_dbl);

    /* This test can be useful if your cost function goes from a positive
       to a negative value, and you do not want to get get stuck in a local
       minima around zero due to the default in reanneal().  Pick any
       number instead of 0.0001 */
    tmp_dbl = MIN (fabs (*cost_last), fabs (*cost_best));
    if (tmp_dbl < 0.0001)
        cost_test = FALSE;
    else
        cost_test = TRUE;
#else
    tmp_dbl = MAX (fabs (*cost_last), fabs (*cost_best));
    tmp_dbl = MAX ((double) EPS_DOUBLE, tmp_dbl);
    *initial_cost_temperature = MIN (*initial_cost_temperature, tmp_dbl);

    cost_test = TRUE;
#endif

#endif /* ASA_TEMPLATE */

    return (cost_test);
}
#endif /* USER_REANNEAL_COST */

#if USER_REANNEAL_PARAMETERS
#if HAVE_ANSI
double
user_reanneal_params (double current_temp,
                      double tangent,
                      double max_tangent,
                      USER_DEFINES * USER_OPTIONS)
#else
double
user_reanneal_params (current_temp,
                      tangent,
                      max_tangent,
                      USER_OPTIONS)
double current_temp;
double tangent;
double max_tangent;
USER_DEFINES *USER_OPTIONS;
#endif /* HAVE_ANSI */
{
#if ASA_TEMPLATE
    double x;

    x = current_temp * (max_tangent / tangent);

    return (x);
#endif
}
#endif /* USER_REANNEAL_PARAMETERS */

#if SELF_OPTIMIZE

/***********************************************************************
* main
*	This is a sample calling program to self-optimize ASA
***********************************************************************/
#if HAVE_ANSI
#if ASA_LIB
void
asa_main ()
#else
int
main (int argc, char **argv)
#endif
#else
#if ASA_LIB
void
asa_main ()
#else
int
main (argc, argv)
int argc;
char **argv;
#endif
#endif
{

    /* seed for random number generator */
    static LONG_INT *recur_rand_seed;

#if RECUR_OPTIONS_FILE
    FILE *recur_ptr_options;
    char read_option[80];
    int read_int;
#if INT_LONG
    LONG_INT read_long;
#endif
    double read_double;
#endif

    int *recur_exit_code;
#if ASA_LIB
#else
    int compile_cnt;
#endif

    double *recur_parameter_lower_bound, *recur_parameter_upper_bound;
    double *recur_cost_parameters, *recur_cost_tangents, *recur_cost_curvature;
    double recur_cost_value;

    ALLOC_INT *recur_parameter_dimension;
    int *recur_parameter_int_real;
    int *recur_cost_flag;
    int recur_v;

    USER_DEFINES *RECUR_USER_OPTIONS;

    if ((recur_parameter_dimension =
                (ALLOC_INT *) calloc (1, sizeof (ALLOC_INT))) == NULL)
        exit (9);
    if ((recur_exit_code = (int *) calloc (1, sizeof (int))) == NULL)
        exit (9);
    if ((recur_cost_flag = (int *) calloc (1, sizeof (int))) == NULL)
        exit (9);

    if ((RECUR_USER_OPTIONS =
                (USER_DEFINES *) calloc (1, sizeof (USER_DEFINES))) == NULL)
        exit (9);

#if RECUR_OPTIONS_FILE
    recur_ptr_options = fopen ("asa_opt_recur", "r");

#if INT_LONG
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%ld", &read_long);
    RECUR_USER_OPTIONS->Limit_Acceptances = read_long;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%ld", &read_long);
    RECUR_USER_OPTIONS->Limit_Generated = read_long;
#else
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Limit_Acceptances = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Limit_Generated = read_int;
#endif
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Limit_Invalid_Generated_States = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Accepted_To_Generated_Ratio = read_double;

    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Cost_Precision = read_double;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Maximum_Cost_Repeat = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Number_Cost_Samples = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Temperature_Ratio_Scale = read_double;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Cost_Parameter_Scale_Ratio = read_double;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Temperature_Anneal_Scale = read_double;

    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Include_Integer_Parameters = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->User_Initial_Parameters = read_int;
#if INT_ALLOC
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Sequential_Parameters = read_int;
#else
#if INT_LONG
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%ld", &read_long);
    RECUR_USER_OPTIONS->Sequential_Parameters = read_long;
#else
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Sequential_Parameters = read_int;
#endif
#endif
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Initial_Parameter_Temperature = read_double;

    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Acceptance_Frequency_Modulus = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Generated_Frequency_Modulus = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Reanneal_Cost = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Reanneal_Parameters = read_int;

    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%lf", &read_double);
    RECUR_USER_OPTIONS->Delta_X = read_double;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->User_Tangents = read_int;
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%d", &read_int);
    RECUR_USER_OPTIONS->Curvature_0 = read_int;

#else /* RECUR_OPTIONS_FILE */
    RECUR_USER_OPTIONS->Limit_Acceptances = 100;
    RECUR_USER_OPTIONS->Limit_Generated = 1000;
    RECUR_USER_OPTIONS->Limit_Invalid_Generated_States = 1000;
    RECUR_USER_OPTIONS->Accepted_To_Generated_Ratio = 1.0E-4;

    RECUR_USER_OPTIONS->Cost_Precision = 1.0E-18;
    RECUR_USER_OPTIONS->Maximum_Cost_Repeat = 2;
    RECUR_USER_OPTIONS->Number_Cost_Samples = 2;
    RECUR_USER_OPTIONS->Temperature_Ratio_Scale = 1.0E-5;
    RECUR_USER_OPTIONS->Cost_Parameter_Scale_Ratio = 1.0;
    RECUR_USER_OPTIONS->Temperature_Anneal_Scale = 100.0;

    RECUR_USER_OPTIONS->Include_Integer_Parameters = FALSE;
    RECUR_USER_OPTIONS->User_Initial_Parameters = TRUE;
    RECUR_USER_OPTIONS->Sequential_Parameters = -1;
    RECUR_USER_OPTIONS->Initial_Parameter_Temperature = 1.0;

    RECUR_USER_OPTIONS->Acceptance_Frequency_Modulus = 15;
    RECUR_USER_OPTIONS->Generated_Frequency_Modulus = 10000;
    RECUR_USER_OPTIONS->Reanneal_Cost = FALSE;
    RECUR_USER_OPTIONS->Reanneal_Parameters = FALSE;

    RECUR_USER_OPTIONS->Delta_X = 1.0E-6;
    RECUR_USER_OPTIONS->User_Tangents = FALSE;
    RECUR_USER_OPTIONS->Curvature_0 = TRUE;

#endif /* RECUR_OPTIONS_FILE */

    /* the number of parameters for the recur_cost_function */
#if RECUR_OPTIONS_FILE_DATA
    fscanf (recur_ptr_options, "%s", read_option);
    fscanf (recur_ptr_options, "%s", read_option);

#if INT_ALLOC
    fscanf (recur_ptr_options, "%d", &read_int);
    *recur_parameter_dimension = read_int;
#else
#if INT_LONG
    fscanf (recur_ptr_options, "%ld", &read_long);
    *recur_parameter_dimension = read_long;
#else
    fscanf (recur_ptr_options, "%d", &read_int);
    *recur_parameter_dimension = read_int;
#endif
#endif

#else /* RECUR_OPTIONS_FILE_DATA */
#if ASA_TEMPLATE_SELFOPT
    *recur_parameter_dimension = 2;
#endif
#if ASA_TEMPLATE		/* MY_COST */
    /* If not using RECUR_OPTIONS_FILE_DATA, here
    here insert the number of parameters for the recur_cost_function */
#endif /* MY_COST */
#endif /* RECUR_OPTIONS_FILE_DATA */

    if ((recur_parameter_lower_bound =
                (double *) calloc (*recur_parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    if ((recur_parameter_upper_bound =
                (double *) calloc (*recur_parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);

    if ((recur_cost_parameters =
                (double *) calloc (*recur_parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);

    if ((recur_parameter_int_real =
                (int *) calloc (*recur_parameter_dimension, sizeof (int))
        ) == NULL)
        exit (9);

    if ((recur_cost_tangents =
                (double *) calloc (*recur_parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);

    if (RECUR_USER_OPTIONS->Curvature_0 == FALSE
            || RECUR_USER_OPTIONS->Curvature_0 == -1)
    {

        if ((recur_cost_curvature =
                    (double *) calloc ((*recur_parameter_dimension)
                                       * (*recur_parameter_dimension),
                                       sizeof (double))) == NULL)
            exit (9);
    }
    else
    {
        recur_cost_curvature = (double *) NULL;
    }

#if ASA_TEMPLATE_SELFOPT
    /* Set memory to that required for use. */
    RECUR_USER_OPTIONS->Asa_Data_Dim = 1;
    if ((RECUR_USER_OPTIONS->Asa_Data =
                (double *) calloc (1, sizeof (double))) == NULL)
        exit (9);
    /* Use Asa_Data[0] as flag, e.g., if used with SELF_OPTIMIZE. */
    RECUR_USER_OPTIONS->Asa_Data[0] = 0;
#endif

    /* open the output file */
#if ASA_SAVE
    ptr_out = fopen ("user_out", "a");
#else
    ptr_out = fopen ("user_out", "w");
#endif
    /* use this instead if you want output to stdout */
#if FALSE
    ptr_out = stdout;
#endif
    fprintf (ptr_out, "%s\n\n", USER_ID);

#if ASA_LIB
#else
    /* print out compile options set by user in Makefile */
    if (argc > 1)
    {
        fprintf (ptr_out, "CC = %s\n", argv[1]);
        for (compile_cnt = 2; compile_cnt < argc; ++compile_cnt)
        {
            fprintf (ptr_out, "\t%s\n", argv[compile_cnt]);
        }
        fprintf (ptr_out, "\n");
    }
#endif
#if TIME_CALC
    /* print starting time */
    print_time ("start", ptr_out);
#endif
    fflush (ptr_out);

    if ((recur_rand_seed =
                (LONG_INT *) calloc (1, sizeof (LONG_INT))) == NULL)
        exit (9);

    /* first value of *recur_rand_seed */
    *recur_rand_seed = 696969;
    randflt (recur_rand_seed);

#if USER_COST_SCHEDULE
    RECUR_USER_OPTIONS->Cost_Schedule = recur_user_cost_schedule;
#endif
#if USER_ACCEPTANCE_TEST
    RECUR_USER_OPTIONS->Acceptance_Test = recur_user_acceptance_test;
#endif
#if USER_GENERATING_FUNCTION
    RECUR_USER_OPTIONS->Generating_Distrib = recur_user_generating_distrib;
#endif
#if USER_REANNEAL_COST
    RECUR_USER_OPTIONS->Reanneal_Cost_Function = recur_user_reanneal_cost;
#endif
#if USER_REANNEAL_PARAMETERS
    RECUR_USER_OPTIONS->Reanneal_Params_Function = recur_user_reanneal_params;
#endif

    /* initialize the users parameters, allocating space, etc.
       Note that the default is to have asa generate the initial
       recur_cost_parameters that satisfy the user's constraints. */

    recur_initialize_parameters (recur_cost_parameters,
                                 recur_parameter_lower_bound,
                                 recur_parameter_upper_bound,
                                 recur_cost_tangents,
                                 recur_cost_curvature,
                                 recur_parameter_dimension,
                                 recur_parameter_int_real,
#if RECUR_OPTIONS_FILE_DATA
                                 recur_ptr_options,
#endif
                                 RECUR_USER_OPTIONS);
#if RECUR_OPTIONS_FILE
    fclose (recur_ptr_options);
#endif


#if USER_ASA_OUT
    if ((RECUR_USER_OPTIONS->Asa_Out_File =
                (char *) calloc (80, sizeof (char))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE_SELFOPT
    strcpy (RECUR_USER_OPTIONS->Asa_Out_File, "asa_sfop");
#endif
#endif
    recur_cost_value = asa (recur_cost_function,
                            randflt,
                            recur_rand_seed,
                            recur_cost_parameters,
                            recur_parameter_lower_bound,
                            recur_parameter_upper_bound,
                            recur_cost_tangents,
                            recur_cost_curvature,
                            recur_parameter_dimension,
                            recur_parameter_int_real,
                            recur_cost_flag,
                            recur_exit_code,
                            RECUR_USER_OPTIONS);
    fprintf (ptr_out, "\n\n recur_cost_value = %12.7g\n",
             recur_cost_value);

    for (recur_v = 0; recur_v < *recur_parameter_dimension; ++recur_v)
        fprintf (ptr_out, "recur_cost_parameters[%d] = %12.7g\n",
                 recur_v, recur_cost_parameters[recur_v]);

    fprintf (ptr_out, "\n\n");

#if TIME_CALC
    /* print ending time */
    print_time ("end", ptr_out);
#endif

    /* close all files */
    fclose (ptr_out);

#if OPTIONAL_DATA
    free (RECUR_USER_OPTIONS->Asa_Data);
#endif
#if OPTIONAL_DATA_INT
    free (RECUR_USER_OPTIONS->Asa_Data_Int);
#endif
#if USER_ASA_OUT
    free (RECUR_USER_OPTIONS->Asa_Out_File);
#endif
#if ASA_SAMPLE
    free (RECUR_USER_OPTIONS->Bias_Generated);
#endif
    if (RECUR_USER_OPTIONS->Curvature_0 == FALSE
            || RECUR_USER_OPTIONS->Curvature_0 == -1)
        free (recur_cost_curvature);
#if USER_INITIAL_PARAMETERS_TEMPS
    free (RECUR_USER_OPTIONS->User_Parameter_Temperature);
#endif
#if USER_INITIAL_COST_TEMP
    free (RECUR_USER_OPTIONS->User_Cost_Temperature);
#endif
#if DELTA_PARAMETERS
    free (RECUR_USER_OPTIONS->User_Delta_Parameter);
#endif
#if QUENCH_PARAMETERS
    free (RECUR_USER_OPTIONS->User_Quench_Param_Scale);
#endif
#if QUENCH_COST
    free (RECUR_USER_OPTIONS->User_Quench_Cost_Scale);
#endif
#if RATIO_TEMPERATURE_SCALES
    free (RECUR_USER_OPTIONS->User_Temperature_Ratio);
#endif
    free (RECUR_USER_OPTIONS);
    free (recur_parameter_dimension);
    free (recur_exit_code);
    free (recur_cost_flag);
    free (recur_parameter_lower_bound);
    free (recur_parameter_upper_bound);
    free (recur_cost_parameters);
    free (recur_parameter_int_real);
    free (recur_cost_tangents);
    free (recur_rand_seed);

#if ASA_LIB
#else
    exit (0);
    /* NOTREACHED */
#endif
}

/***********************************************************************
* recur_initialize_parameters
*	This depends on the users cost function to optimize (minimum).
*	The routine allocates storage needed for asa. The user should
*	define the number of parameters and their ranges,
*	and make sure the initial parameters are within
*	the minimum and maximum ranges. The array
*	recur_parameter_int_real should be REAL_TYPE (-1)
*       for real parameters,
***********************************************************************/
#if HAVE_ANSI
void
recur_initialize_parameters (double *recur_cost_parameters,
                             double *recur_parameter_lower_bound,
                             double *recur_parameter_upper_bound,
                             double *recur_cost_tangents,
                             double *recur_cost_curvature,
                             ALLOC_INT * recur_parameter_dimension,
                             int *recur_parameter_int_real,
#if RECUR_OPTIONS_FILE_DATA
                             FILE * recur_ptr_options,
#endif
                             USER_DEFINES * RECUR_USER_OPTIONS)
#else
void
recur_initialize_parameters (recur_cost_parameters,
                             recur_parameter_lower_bound,
                             recur_parameter_upper_bound,
                             recur_cost_tangents,
                             recur_cost_curvature,
                             recur_parameter_dimension,
                             recur_parameter_int_real,
#if RECUR_OPTIONS_FILE_DATA
                             recur_ptr_options,
#endif
                             RECUR_USER_OPTIONS)
double *recur_parameter_lower_bound;
double *recur_parameter_upper_bound;
double *recur_cost_parameters;
double *recur_cost_tangents;
double *recur_cost_curvature;
ALLOC_INT *recur_parameter_dimension;
int *recur_parameter_int_real;
#if RECUR_OPTIONS_FILE_DATA
FILE *recur_ptr_options;
#endif
USER_DEFINES *RECUR_USER_OPTIONS;
#endif
{
    ALLOC_INT index;
#if RECUR_OPTIONS_FILE_DATA
    char read_option[80];
    ALLOC_INT read_index;
#endif

#if RECUR_OPTIONS_FILE_DATA
    fscanf (recur_ptr_options, "%s", read_option);

    for (index = 0; index < *recur_parameter_dimension; ++index)
    {
#if INT_ALLOC
        fscanf (recur_ptr_options, "%d", &read_index);
#else
#if INT_LONG
        fscanf (recur_ptr_options, "%ld", &read_index);
#else
        fscanf (recur_ptr_options, "%d", &read_index);
#endif
#endif
        fscanf (recur_ptr_options, "%lf%lf%lf%d",
                &(recur_parameter_lower_bound[read_index]),
                &(recur_parameter_upper_bound[read_index]),
                &(recur_cost_parameters[read_index]),
                &(recur_parameter_int_real[read_index]));
    }
#else /* RECUR_OPTIONS_FILE_DATA */
#if ASA_TEMPLATE_SELFOPT
    /*  NOTE:
    USER_OPTIONS->Temperature_Ratio_Scale = x[0];
    USER_OPTIONS->Cost_Parameter_Scale_Ratio = x[1];
    */

    /* store the initial parameter values */
    recur_cost_parameters[0] = 1.0E-5;
    recur_cost_parameters[1] = 1.0;

    recur_parameter_lower_bound[0] = 1.0E-6;
    recur_parameter_upper_bound[0] = 1.0E-4;

    recur_parameter_lower_bound[1] = 0.5;
    recur_parameter_upper_bound[1] = 3.0;

    /* store the initial parameter types */
    for (index = 0; index < *recur_parameter_dimension; ++index)
        recur_parameter_int_real[index] = REAL_TYPE;
#endif
#if ASA_TEMPLATE		/* MY_COST */
    /* If not using RECUR_OPTIONS_FILE_DATA, here
    store the recur_parameter ranges
    store the recur_parameter types
    store the initial recur_parameter values */
#endif /* MY_COST */
#endif /* RECUR_OPTIONS_FILE_DATA */

#if USER_INITIAL_PARAMETERS_TEMPS
    if ((RECUR_USER_OPTIONS->User_Parameter_Temperature =
                (double *) calloc (*recur_parameter_dimension,
                                   sizeof (double))) == NULL)
        exit (9);
    for (index = 0; index < *recur_parameter_dimension; ++index)
        RECUR_USER_OPTIONS->User_Parameter_Temperature[index] = 1.0;
#endif /* USER_INITIAL_PARAMETERS_TEMPS */
#if USER_INITIAL_COST_TEMP
    if ((RECUR_USER_OPTIONS->User_Cost_Temperature =
                (double *) calloc (1, sizeof (double))) == NULL)
        exit (9);
    RECUR_USER_OPTIONS->User_Cost_Temperature[0] = 5.936648E+09;
#endif /* USER_INITIAL_COST_TEMP */
#if DELTA_PARAMETERS
    if ((RECUR_USER_OPTIONS->User_Delta_Parameter =
                (double *) calloc (*recur_parameter_dimension,
                                   sizeof (double))) == NULL)
        exit (9);
    for (index = 0; index < *recur_parameter_dimension; ++index)
        RECUR_USER_OPTIONS->User_Delta_Parameter[index] = 0.001;
#endif /* DELTA_PARAMETERS */
#if QUENCH_PARAMETERS
    if ((RECUR_USER_OPTIONS->User_Quench_Param_Scale =
                (double *) calloc (*recur_parameter_dimension,
                                   sizeof (double))) == NULL)
        exit (9);
#if ASA_TEMPLATE
    for (index = 0; index < *recur_parameter_dimension; ++index)
        RECUR_USER_OPTIONS->User_Quench_Param_Scale[index] = 1.0;
#endif
#endif /* QUENCH_PARAMETERS */
#if QUENCH_COST
    if ((RECUR_USER_OPTIONS->User_Quench_Cost_Scale =
                (double *) calloc (1, sizeof (double))) == NULL)
        exit (9);
#if ASA_TEMPLATE
    RECUR_USER_OPTIONS->User_Quench_Cost_Scale[0] = 1.0;
#endif
#endif /* QUENCH_COST */
#if RATIO_TEMPERATURE_SCALES
    if ((RECUR_USER_OPTIONS->User_Temperature_Ratio =
                (double *) calloc (*recur_parameter_dimension,
                                   sizeof (double))) == NULL)
        exit (9);
#if ASA_TEMPLATE
    for (index = 0; index < *recur_parameter_dimension; ++index)
        RECUR_USER_OPTIONS->User_Temperature_Ratio[index] = 1.0;
#endif
#endif /* RATIO_TEMPERATURE_SCALES */
    /* Defines the limit of collection of sampled data by asa */
#if ASA_SAMPLE
    /* create memory for Bias_Generated[] */
    if ((RECUR_USER_OPTIONS->Bias_Generated =
                (double *) calloc (*recur_parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE
    RECUR_USER_OPTIONS->Limit_Weights = 1.0E-7;
#if QUENCH_COST
    RECUR_USER_OPTIONS->User_Quench_Cost_Scale[0] = 1.0;
#endif
#if QUENCH_PARAMETERS
    for (index = 0; index < *recur_parameter_dimension; ++index)
        RECUR_USER_OPTIONS->User_Quench_Param_Scale[index] = 1.0;
#endif
#endif /* ASA_TEMPLATE */
#endif /* ASA_SAMPLE */

#if ASA_TEMPLATE
#if ASA_PARALLEL
    RECUR_USER_OPTIONS->Gener_Block = 1;
    RECUR_USER_OPTIONS->Gener_Block_Max = 1;
    RECUR_USER_OPTIONS->Gener_Mov_Avr = 1;
#endif
#endif
}

/***********************************************************************
* double recur_cost_function
*	This is the users cost function to optimize
*	(find the minimum).
*	cost_flag is set to TRUE if the parameter set
*	does not violates any constraints
*       recur_parameter_lower_bound and recur_parameter_upper_bound
*       may be adaptively changed during the search.
***********************************************************************/
#if HAVE_ANSI
double
recur_cost_function (double *x,
                     double *recur_parameter_lower_bound,
                     double *recur_parameter_upper_bound,
                     double *recur_cost_tangents,
                     double *recur_cost_curvature,
                     ALLOC_INT * recur_parameter_dimension,
                     int *recur_parameter_int_real,
                     int *recur_cost_flag,
                     int *recur_exit_code,
                     USER_DEFINES * RECUR_USER_OPTIONS)
#else
double
recur_cost_function (x,
                     recur_parameter_lower_bound,
                     recur_parameter_upper_bound,
                     recur_cost_tangents,
                     recur_cost_curvature,
                     recur_parameter_dimension,
                     recur_parameter_int_real,
                     recur_cost_flag,
                     recur_exit_code,
                     RECUR_USER_OPTIONS)
double *x;
double *recur_parameter_lower_bound;
double *recur_parameter_upper_bound;
double *recur_cost_tangents;
double *recur_cost_curvature;
ALLOC_INT *recur_parameter_dimension;
int *recur_parameter_int_real;
int *recur_cost_flag;
int *recur_exit_code;
USER_DEFINES *RECUR_USER_OPTIONS;
#endif
{
    double cost_value;
    static LONG_INT recur_funevals = 0;
    int *exit_code;
#if OPTIONS_FILE
    FILE *ptr_options;
    char read_option[80];
    int read_int;
#if INT_LONG
    LONG_INT read_long;
#endif
    double read_double;
#endif

    double *parameter_lower_bound, *parameter_upper_bound;
    double *cost_parameters;
    double *cost_tangents, *cost_curvature;
    ALLOC_INT *parameter_dimension;
    int *parameter_int_real;
    int *cost_flag;
    static LONG_INT *rand_seed;
    static int initial_flag = 0;


    USER_DEFINES *USER_OPTIONS;

    recur_funevals = recur_funevals + 1;

    if ((rand_seed =
                (LONG_INT *) calloc (1, sizeof (LONG_INT))) == NULL)
        exit (9);

    if ((USER_OPTIONS =
                (USER_DEFINES *) calloc (1, sizeof (USER_DEFINES))) == NULL)
        exit (9);

#if OPTIONS_FILE
    /* Test to see if asa_opt is in correct directory.
       This is useful for some PC and Mac compilers. */
    if ((ptr_options = fopen ("asa_opt", "r")) == NULL)
        exit (6);

#if INT_LONG
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%ld", &read_long);
    USER_OPTIONS->Limit_Acceptances = read_long;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%ld", &read_long);
    USER_OPTIONS->Limit_Generated = read_long;
#else
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Limit_Acceptances = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Limit_Generated = read_int;
#endif
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Limit_Invalid_Generated_States = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Accepted_To_Generated_Ratio = read_double;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Cost_Precision = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Maximum_Cost_Repeat = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Number_Cost_Samples = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Temperature_Ratio_Scale = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Cost_Parameter_Scale_Ratio = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Temperature_Anneal_Scale = read_double;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Include_Integer_Parameters = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->User_Initial_Parameters = read_int;
#if INT_ALLOC
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Sequential_Parameters = read_int;
#else
#if INT_LONG
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%ld", &read_long);
    USER_OPTIONS->Sequential_Parameters = read_long;
#else
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Sequential_Parameters = read_int;
#endif
#endif
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Initial_Parameter_Temperature = read_double;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Acceptance_Frequency_Modulus = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Generated_Frequency_Modulus = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Reanneal_Cost = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Reanneal_Parameters = read_int;

    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%lf", &read_double);
    USER_OPTIONS->Delta_X = read_double;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->User_Tangents = read_int;
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%d", &read_int);
    USER_OPTIONS->Curvature_0 = read_int;
#else /* OPTIONS_FILE */
    /* USER_OPTIONS->Limit_Acceptances = 10000; */
    USER_OPTIONS->Limit_Acceptances = 1000;
    USER_OPTIONS->Limit_Generated = 99999;
    USER_OPTIONS->Limit_Invalid_Generated_States = 1000;
    USER_OPTIONS->Accepted_To_Generated_Ratio = 1.0E-6;

    USER_OPTIONS->Cost_Precision = 1.0E-18;
    USER_OPTIONS->Maximum_Cost_Repeat = 2;
    USER_OPTIONS->Number_Cost_Samples = 2;

    /* These variables are set below in x[.] */
    /* USER_OPTIONS->Temperature_Ratio_Scale = 1.0E-5; */
    /* USER_OPTIONS->Cost_Parameter_Scale_Ratio = 1.0; */

    USER_OPTIONS->Temperature_Anneal_Scale = 100.;

    USER_OPTIONS->Include_Integer_Parameters = FALSE;
    USER_OPTIONS->User_Initial_Parameters = FALSE;
    USER_OPTIONS->Sequential_Parameters = -1;
    USER_OPTIONS->Initial_Parameter_Temperature = 1.0;

    USER_OPTIONS->Acceptance_Frequency_Modulus = 100;
    USER_OPTIONS->Generated_Frequency_Modulus = 10000;
    USER_OPTIONS->Reanneal_Cost = TRUE;
    USER_OPTIONS->Reanneal_Parameters = TRUE;

    USER_OPTIONS->Delta_X = 0.001;
    USER_OPTIONS->User_Tangents = FALSE;
    USER_OPTIONS->Curvature_0 = TRUE;
#endif /* OPTIONS_FILE */

    USER_OPTIONS->Temperature_Ratio_Scale = x[0];
    USER_OPTIONS->Cost_Parameter_Scale_Ratio = x[1];

    if (initial_flag == 0)
    {
        /* first value of *rand_seed */
        *rand_seed = 696969;
    }

    if ((parameter_dimension =
                (ALLOC_INT *) calloc (1, sizeof (ALLOC_INT))) == NULL)
        exit (9);
    if ((exit_code = (int *) calloc (1, sizeof (int))) == NULL)
        exit (9);
    if ((cost_flag = (int *) calloc (1, sizeof (int))) == NULL)
        exit (9);

    /* the number of parameters for the cost function */
#if OPTIONS_FILE_DATA
    fscanf (ptr_options, "%s", read_option);
    fscanf (ptr_options, "%s", read_option);

#if INT_ALLOC
    fscanf (ptr_options, "%d", &read_int);
    *parameter_dimension = read_int;
#else
#if INT_LONG
    fscanf (ptr_options, "%ld", &read_long);
    *parameter_dimension = read_long;
#else
    fscanf (ptr_options, "%d", &read_int);
    *parameter_dimension = read_int;
#endif
#endif

#else /* OPTIONS_FILE_DATA */
#if ASA_TEST
    /* set parameter dimension if SELF_OPTIMIZE=TRUE */
    *parameter_dimension = 4;
    /* end ASA_TEST */
#else /* MY_COST */
    /* If not using OPTIONS_FILE_DATA, here
    set parameter dimension if SELF_OPTIMIZE=TRUE */
#endif /* MY_COST */
#endif /* OPTIONS_FILE_DATA */

    if ((parameter_lower_bound =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    if ((parameter_upper_bound =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    if ((cost_parameters =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);
    if ((parameter_int_real =
                (int *) calloc (*parameter_dimension, sizeof (int))
        ) == NULL)
        exit (9);
    if ((cost_tangents =
                (double *) calloc (*parameter_dimension, sizeof (double))
        ) == NULL)
        exit (9);

    if (USER_OPTIONS->Curvature_0 == FALSE || USER_OPTIONS->Curvature_0 == -1)
    {
        if ((cost_curvature =
                    (double *) calloc ((*parameter_dimension) *
                                       (*parameter_dimension),
                                       sizeof (double))) == NULL)
            exit (9);
    }
    else
    {
        cost_curvature = (double *) NULL;
    }

#if ASA_TEMPLATE_SELFOPT
    /* Set memory to that required for use. */
    USER_OPTIONS->Asa_Data_Dim = 2;
    if ((USER_OPTIONS->Asa_Data =
                (double *) calloc (2, sizeof (double))) == NULL)
        exit (9);
    /* Use Asa_Data[0] as flag, e.g., if used with SELF_OPTIMIZE. */
    USER_OPTIONS->Asa_Data[0] = 1.0;
#endif

#if USER_COST_SCHEDULE
    USER_OPTIONS->Cost_Schedule = user_cost_schedule;
#endif
#if USER_ACCEPTANCE_TEST
    USER_OPTIONS->Acceptance_Test = user_acceptance_test;
#endif
#if USER_GENERATING_FUNCTION
    USER_OPTIONS->Generating_Distrib = user_generating_distrib;
#endif
#if USER_REANNEAL_COST
    USER_OPTIONS->Reanneal_Cost_Function = user_reanneal_cost;
#endif
#if USER_REANNEAL_PARAMETERS
    USER_OPTIONS->Reanneal_Params_Function = user_reanneal_params;
#endif

    initialize_parameters (cost_parameters,
                           parameter_lower_bound,
                           parameter_upper_bound,
                           cost_tangents,
                           cost_curvature,
                           parameter_dimension,
                           parameter_int_real,
#if OPTIONS_FILE_DATA
                           ptr_options,
#endif
                           USER_OPTIONS);
#if OPTIONS_FILE
    fclose (ptr_options);
#endif

    /* It might be a good idea to place a loop around this call,
       and to average over several values of funevals returned by
       trajectories of cost_value. */

    funevals = 0;

#if USER_ASA_OUT
    if ((USER_OPTIONS->Asa_Out_File =
                (char *) calloc (80, sizeof (char))
        ) == NULL)
        exit (9);
#if ASA_TEMPLATE_SELFOPT
    strcpy (USER_OPTIONS->Asa_Out_File, "asa_rcur");
#endif
#endif
    cost_value = asa (cost_function,
                      randflt,
                      rand_seed,
                      cost_parameters,
                      parameter_lower_bound,
                      parameter_upper_bound,
                      cost_tangents,
                      cost_curvature,
                      parameter_dimension,
                      parameter_int_real,
                      cost_flag,
                      exit_code,
                      USER_OPTIONS);

    if (cost_value > .001)
    {
        *recur_cost_flag = FALSE;
    }
    else
    {
        *recur_cost_flag = TRUE;
    }

#if FALSE			/* set to 1 to activate FAST EXIT */
    /* Make a quick exit */
    if (recur_funevals >= 10)
    {
        *recur_cost_flag = FALSE;
        RECUR_USER_OPTIONS->Limit_Invalid_Generated_States = 0;
        fprintf (ptr_out, "FAST EXIT set at recur_funevals = 10\n\n");
    }
#endif

    /* print every RECUR_PRINT_FREQUENCY evaluations */
    if ((RECUR_PRINT_FREQUENCY > 0) &&
            ((recur_funevals % RECUR_PRINT_FREQUENCY) == 0))
    {
        USER_OPTIONS->Temperature_Ratio_Scale = x[0];
        fprintf (ptr_out, "USER_OPTIONS->Temperature_Ratio_Scale = %12.7g\n",
                 USER_OPTIONS->Temperature_Ratio_Scale);
        USER_OPTIONS->Cost_Parameter_Scale_Ratio = x[1];
        fprintf (ptr_out, "USER_OPTIONS->Cost_Parameter_Scale_Ratio = %12.7g\n",
                 USER_OPTIONS->Cost_Parameter_Scale_Ratio);
    }
#if TIME_CALC
    print_time ("", ptr_out);
#endif

    fprintf (ptr_out, "recur_funevals = %ld, *recur_cost_flag = %d\n",
             recur_funevals, *recur_cost_flag);
    /* cost function = number generated at best cost */
#if ASA_TEMPLATE_SELFOPT
    funevals = (LONG_INT) (USER_OPTIONS->Asa_Data[1]);
    fprintf (ptr_out, "\tbest_funevals = %ld, cost_value = %12.7g\n\n",
             funevals, cost_value);
    /* cost function = total number generated during run */
#endif
#if ASA_SAMPLE
    fprintf (ptr_out, "\tfunevals = %ld, cost_value = %12.7g\n\n",
             funevals, cost_value);
#endif
    fflush (ptr_out);

#if ASA_TEMPLATE_SAMPLE
    ptr_asa = fopen ("asa_out", "r");
    sample (ptr_out, ptr_asa);
#endif

#if OPTIONAL_DATA
    free (USER_OPTIONS->Asa_Data);
#endif
#if OPTIONAL_DATA_INT
    free (USER_OPTIONS->Asa_Data_Int);
#endif
#if USER_ASA_OUT
    free (USER_OPTIONS->Asa_Out_File);
#endif
#if ASA_SAMPLE
    free (USER_OPTIONS->Bias_Generated);
#endif
    if (USER_OPTIONS->Curvature_0 == FALSE || USER_OPTIONS->Curvature_0 == -1)
        free (cost_curvature);
#if USER_INITIAL_PARAMETERS_TEMPS
    free (USER_OPTIONS->User_Parameter_Temperature);
#endif
#if USER_INITIAL_COST_TEMP
    free (USER_OPTIONS->User_Cost_Temperature);
#endif
#if DELTA_PARAMETERS
    free (USER_OPTIONS->User_Delta_Parameter);
#endif
#if QUENCH_PARAMETERS
    free (USER_OPTIONS->User_Quench_Param_Scale);
#endif
#if QUENCH_COST
    free (USER_OPTIONS->User_Quench_Cost_Scale);
#endif
#if RATIO_TEMPERATURE_SCALES
    free (USER_OPTIONS->User_Temperature_Ratio);
#endif
    free (USER_OPTIONS);
    free (parameter_dimension);
    free (exit_code);
    free (cost_flag);
    free (parameter_lower_bound);
    free (parameter_upper_bound);
    free (cost_parameters);
    free (parameter_int_real);
    free (cost_tangents);
    free (rand_seed);

    return ((double) funevals);
}

#if USER_COST_SCHEDULE
#if HAVE_ANSI
double
recur_user_cost_schedule (double test_temperature,
                          USER_DEFINES * RECUR_USER_OPTIONS)
#else
double
recur_user_cost_schedule (test_temperature,
                          RECUR_USER_OPTIONS)
double test_temperature;
USER_DEFINES *RECUR_USER_OPTIONS;
#endif /* HAVE_ANSI */
{
#if ASA_TEMPLATE
    double x;

    x = test_temperature;

    return (x);
#endif
}
#endif /* USER_COST_SCHEDULE */

#if USER_ACCEPTANCE_TEST
#if HAVE_ANSI
void
recur_user_acceptance_test (double current_cost,
                            ALLOC_INT * recur_parameter_dimension,
                            USER_DEFINES * RECUR_USER_OPTIONS)
#else
void
recur_user_acceptance_test (current_cost,
                            recur_parameter_dimension,
                            RECUR_USER_OPTIONS)
double current_cost;
ALLOC_INT *recur_parameter_dimension;
USER_DEFINES *RECUR_USER_OPTIONS;
#endif /* HAVE_ANSI */
{
    double x, uniform_test;
#if ASA_TEMPLATE
    double q, delta_cost, curr_cost_temp;
#endif
#if FALSE			/* set to TRUE to activate */
    /* Calculate the current ASA cost index.  This could be useful
       to define a new schedule for the cost temperature, beyond
       simple changes that can be made using USER_COST_SCHEDULE. */

    double k_temperature, quench, y;

#if QUENCH_COST
    quench = RECUR_USER_OPTIONS->User_Quench_Cost_Scale[0];
#else
    quench = 1.0;
#endif
    y = -F_LOG (RECUR_USER_OPTIONS->Cost_Temp_Curr
                / RECUR_USER_OPTIONS->Cost_Temp_Init)
        / RECUR_USER_OPTIONS->Cost_Temp_Scale;

    k_temperature = F_POW (y, (double) *recur_parameter_dimension / quench);
#endif

    uniform_test = randflt (RECUR_USER_OPTIONS->Random_Seed);
    curr_cost_temp = RECUR_USER_OPTIONS->Cost_Temp_Curr;

#if ASA_TEMPLATE
#if USER_COST_SCHEDULE
    curr_cost_temp =
        (RECUR_USER_OPTIONS->Cost_Schedule (RECUR_USER_OPTIONS->Cost_Temp_Curr,
                                            RECUR_USER_OPTIONS)
         + EPS_DOUBLE);
#else
    curr_cost_temp = RECUR_USER_OPTIONS->Cost_Temp_Curr;
#endif

    delta_cost = (current_cost - RECUR_USER_OPTIONS->Last_Cost)
                 / (curr_cost_temp + EPS_DOUBLE);

    q = 1.0;			/* negative q may speed up annealing */
    if (fabs (1.0 - q) < EPS_DOUBLE)
        x = MIN (1.0, (F_EXP (-delta_cost)));	/* Boltzmann test */
    else if ((1.0 - (1.0 - q) * delta_cost) < EPS_DOUBLE)
        x = MIN (1.0, (F_EXP (-delta_cost)));	/* Boltzmann test */
    else
        x = MIN (1.0, F_POW ((1.0 - (1.0 - q) * delta_cost), (1.0 / (1.0 - q))));

    RECUR_USER_OPTIONS->Prob_Bias = x;
    if (x >= uniform_test)
        RECUR_USER_OPTIONS->User_Acceptance_Flag = TRUE;
    else
        RECUR_USER_OPTIONS->User_Acceptance_Flag = FALSE;

#endif /* ASA_TEMPLATE */
}
#endif /* USER_ACCEPTANCE_TEST */

#if USER_GENERATING_FUNCTION
#if HAVE_ANSI
double
recur_user_generating_distrib (LONG_INT * seed,
                               ALLOC_INT * recur_parameter_dimension,
                               ALLOC_INT index_v,
                               double temperature_v,
                               double init_param_temp_v,
                               double temp_scale_params_v,
                               double parameter_v,
                               double parameter_range_v,
                               USER_DEFINES * RECUR_USER_OPTIONS)
#else
double
recur_user_generating_distrib (seed,
                               recur_parameter_dimension,
                               index_v,
                               temperature_v,
                               init_param_temp_v,
                               temp_scale_params_v,
                               parameter_v,
                               parameter_range_v,
                               RECUR_USER_OPTIONS)
LONG_INT *seed;
ALLOC_INT *recur_parameter_dimension;
ALLOC_INT index_v;
double temperature_v;
double init_param_temp_v;
double temp_scale_params_v;
double parameter_v;
double parameter_range_v;
USER_DEFINES *RECUR_USER_OPTIONS;
#endif
{
    double x, y, z;
#if FALSE			/* set to TRUE to activate */
    /* Calculate the current ASA temperature index for parameter_v.
       This could be useful, e.g., to define a slower polynomial
       or logarithmic schedule, as would be required by Cauchy
       or Gaussian distributions, respectively.  These distributions
       are defined below. */

    double k_temperature_v, temperature_0_v, quench_v;
    static double PI = 3.14159265358979323846;

#if QUENCH_PARAMETERS
    quench_v = USER_OPTIONS->User_Quench_Param_Scale[index_v];
#else
    quench = 1.0;
#endif
    y = -F_LOG (temperature_v / init_param_temp_v) / temp_scale_params_v;

    k_temperature_v = F_POW (y, (double) *recur_parameter_dimension / quench_v);
#endif

#if ASA_TEMPLATE
    /* This is the ASA distribution.  A slower temperature schedule can be
       obtained here, e.g., temperature_v = pow(temperature_v, 0.5); */

    x = randflt (seed);
    y = x < 0.5 ? -1.0 : 1.0;
    z = y * temperature_v * (F_POW ((1.0 + 1.0 / temperature_v),
                                    fabs (2.0 * x - 1.0)) - 1.0);

    x = parameter_v + z * parameter_range_v;
#endif /* ASA_TEMPLATE */

#if FALSE			/* Cauchy Distribution */
    /* Note that this is a one-dimensional Cauchy distribution, which
       may not be optimal for problems in more than one dimension. */

    for (;;)
    {
        x = 2.0 * myrand (seed) - 1.0;
        y = 2.0 * myrand (seed) - 1.0;
        z = x * x + y * y;
        if (z <= 1.0)
            break;
    }
    if (fabs (x) < EPS_DOUBLE)
        x = (x < 0.0 ? x - EPS_DOUBLE : x + EPS_DOUBLE);

    z = (y / x);

    temperature_0_v = parameter_range_v;
    y = temperature_0_v / k_temperature_v;

    x = parameter_v + y * z;

    return (x);
#endif /* Cauchy Distribution */

#if FALSE			/* Gaussian Distribution */
    /* Note that this is a one-dimensional Gaussian distribution, which
       may not be optimal for problems in more than one dimension. */

    x = randflt (seed);
    y = randflt (seed);

    if (x < EPS_DOUBLE)
        x += EPS_DOUBLE;
    z = sqrt (-2.0 * F_LOG (x)) * sin (2.0 * PI * y);

    temperature_0_v = parameter_range_v;
    y = temperature_0_v / F_LOG (k_temperature_v);

    x = parameter_v + y * z;

    return (x);
#endif /* Gaussian Distribution */

    return (x);
}
#endif /* USER_GENERATING_FUNCTION */

#if USER_REANNEAL_COST
#if HAVE_ANSI
int
recur_user_reanneal_cost (double *cost_best, double *cost_last,
                          double *initial_cost_temperature,
                          USER_DEFINES * RECUR_USER_OPTIONS)
#else
int
recur_user_reanneal_cost (cost_best, cost_last,
                          initial_cost_temperature,
                          RECUR_USER_OPTIONS)
double *cost_best;
double *cost_last;
double *initial_cost_temperature;
USER_DEFINES *RECUR_USER_OPTIONS;
#endif /* HAVE_ANSI */
{
#if ASA_TEMPLATE
    double tmp_dbl;

    tmp_dbl = MAX (fabs (*cost_last), fabs (*cost_best));
    tmp_dbl = MAX ((double) EPS_DOUBLE, tmp_dbl);
    *initial_cost_temperature = MIN (*initial_cost_temperature, tmp_dbl);

    return (TRUE);
#endif
}
#endif /* USER_REANNEAL_COST */

#if USER_REANNEAL_PARAMETERS
#if HAVE_ANSI
double
recur_user_reanneal_params (double current_temp,
                            double tangent,
                            double max_tangent,
                            USER_DEFINES * RECUR_USER_OPTIONS)
#else
double
recur_user_reanneal_params (current_temp,
                            tangent,
                            max_tangent,
                            RECUR_USER_OPTIONS)
double current_temp;
double tangent;
double max_tangent;
USER_DEFINES *RECUR_USER_OPTIONS;
#endif /* HAVE_ANSI */
{
#if ASA_TEMPLATE
    double x;

    x = current_temp * (max_tangent / tangent);

    return (x);
#endif
}
#endif /* USER_REANNEAL_PARAMETERS */
#endif /* SELF_OPTIMIZE */

#if ASA_TEMPLATE_SAMPLE

#if HAVE_ANSI
void
sample (FILE * ptr_out, FILE * ptr_asa)
#else
void
sample (ptr_out, ptr_asa)
FILE *ptr_out;
FILE *ptr_asa;
#endif
{
    int ind, n_samples, n_accept, index, dim;
    double cost, cost_temp, bias_accept;
    double param, temp, bias_gener, aver_weight, range;
    double sum, norm, answer, prod, binsize;
    char ch[80], sample[8];

    /*
       This is a demonstration of using ASA_SAMPLE to perform the double integral
       of exp(-x^2 - y^2) for x and y between 0 and 2.  The mesh is quite crude.

       The temperature-dependent acceptance and generated biases factor are
       divided out, and the actual cost function weights each point.
     */

    dim = 2;
    norm = sum = 0.;
    n_samples = 0;

    fprintf (ptr_out,
             ":SAMPLE:   n_accept   cost        cost_temp    bias_accept    \
             aver_weight\n");
    fprintf (ptr_out,
             ":SAMPLE:   index      param[]     temp[]       bias_gener[]   \
             range[]\n");
    for (;;)
    {
        fscanf (ptr_asa, "%s", ch);
        if (!strcmp (ch, "exit_status"))
        {
            break;
        }
        if (strcmp (ch, ":SAMPLE#"))
        {
            continue;
        }
        ++n_samples;
        fprintf (ptr_out, "%s\n", ch);
        fflush (ptr_out);
        fscanf (ptr_asa, "%s%d%lf%lf%lf%lf",
                sample, &n_accept, &cost, &cost_temp, &bias_accept, &aver_weight);
        if (strcmp (sample, ":SAMPLE+"))
        {
            fprintf (ptr_out, "%s %11d %12.7g %12.7g %12.7g %12.7g\n",
                     sample, n_accept, cost, cost_temp, bias_accept, aver_weight);
        }
        else
        {
            fprintf (ptr_out, "%s %10d %12.7g %12.7g %12.7g %12.7g\n",
                     sample, n_accept, cost, cost_temp, bias_accept, aver_weight);
        }
        prod = bias_accept;
        binsize = 1.0;
        for (ind = 0; ind < dim; ++ind)
        {
            fscanf (ptr_asa, "%s%d%lf%lf%lf%lf",
                    sample, &index, &param, &temp, &bias_gener, &range);
            fprintf (ptr_out, "%s %11d %12.7g %12.7g %12.7g %12.7g\n",
                     sample, index, param, temp, bias_gener, range);
            prod *= bias_gener;
            binsize *= range;
        }
        /* In this example, retrieve integrand from sampling function */
        sum += ((F_EXP (-cost) * binsize) / prod);
        norm += (binsize / prod);
    }
    sum /= norm;

    answer = 1.0;
    for (ind = 0; ind < dim; ++ind)
    {
        answer *= (0.5 * sqrt (3.14159265) * erf (2.0));
    }

    fprintf (ptr_out, "\n");
    fprintf (ptr_out, "sum = %12.7g, answer = %12.7g\n", sum, answer);
    fprintf (ptr_out, "n_samples = %d, norm = %12.7g\n", n_samples, norm);
    fflush (ptr_out);

}
#endif /* ASA_TEMPLATE_SAMPLE */
